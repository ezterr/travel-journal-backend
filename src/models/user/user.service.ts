import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { compare } from 'bcrypt';
import {
  CreateUserResponse,
  DeleteUserResponse,
  GetUserResponse,
  GetUserStatsResponse,
  UpdateUserResponse,
} from '../../types';
import { createHashPwd } from '../../common/utils/create-hash-pwd';
import { UserSaveResponseData } from '../../types';
import { Express } from 'express';
import { FileManagementUser } from '../../common/utils/file-management-user';
import { createReadStream } from 'fs';
import { FileManagement } from '../../common/utils/file-management';
import { PostService } from '../post/post.service';
import { TravelService } from '../travel/travel.service';

@Injectable()
export class UserService {
  constructor(
    private readonly travelService: TravelService,
    private readonly postService: PostService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    file: Express.Multer.File,
  ): Promise<CreateUserResponse> {
    try {
      await this.checkUserFieldUniquenessAndThrow({
        email: createUserDto.email,
      });
      await this.checkUserFieldUniquenessAndThrow({
        username: createUserDto.username,
      });

      const user = new User();
      user.firstName = createUserDto.firstName;
      user.lastName = createUserDto.lastName;
      user.username = createUserDto.username;
      user.email = createUserDto.email;
      user.hashPwd = await createHashPwd(createUserDto.password);

      await user.save();

      if (file) {
        if (user.photoFn) {
          await FileManagementUser.removeUserPhoto(user.id, user.photoFn);
        }

        const newFile = await FileManagementUser.saveUserPhoto(user.id, file);
        await FileManagementUser.removeFromTmp(file.filename);

        user.photoFn = newFile.filename;
      }

      await user.save();

      return this.filter(user);
    } catch (e) {
      if (file) await FileManagementUser.removeFromTmp(file.filename);
      throw e;
    }
  }

  async findOne(id: string): Promise<GetUserResponse> {
    if (!id) throw new BadRequestException();

    const user = await User.findOne({ where: { id } });
    if (!user) throw new NotFoundException();

    return this.filter(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    file: Express.Multer.File,
  ): Promise<UpdateUserResponse> {
    try {
      if (!id) throw new BadRequestException();

      const user = await User.findOne({ where: { id } });
      if (!user) throw new NotFoundException();

      user.firstName = updateUserDto.firstName ?? user.firstName;
      user.lastName = updateUserDto.lastName ?? user.lastName;
      user.bio = updateUserDto.bio ?? user.bio;

      if (updateUserDto.newPassword) {
        if (updateUserDto.password) {
          const hashCompareResult = await compare(
            updateUserDto.password,
            user.hashPwd,
          );

          if (hashCompareResult) {
            user.hashPwd = await createHashPwd(updateUserDto.newPassword);
          } else throw new UnauthorizedException();
        } else throw new UnauthorizedException();
      }

      if (file) {
        if (user.photoFn) {
          await FileManagementUser.removeUserPhoto(user.id, user.photoFn);
        }

        const newFile = await FileManagementUser.saveUserPhoto(user.id, file);
        await FileManagementUser.removeFromTmp(file.filename);

        user.photoFn = newFile.filename;
      }

      await user.save();

      return this.filter(user);
    } catch (e) {
      if (file) await FileManagementUser.removeFromTmp(file.filename);
      throw e;
    }
  }

  async remove(id: string): Promise<DeleteUserResponse> {
    if (!id) throw new BadRequestException();

    const user = await User.findOne({ where: { id } });
    if (!user) throw new NotFoundException();

    await FileManagementUser.removeUserDir(id);
    await user.remove();

    return this.filter(user);
  }

  async getStats(id: string): Promise<GetUserStatsResponse> {
    if (!id) throw new BadRequestException();

    const travelCount = await this.travelService.getCountByUserId(id);
    const postCount = await this.postService.getCountByUserId(id);

    return {
      travelCount,
      postCount,
    };
  }

  async getPhoto(id: string) {
    if (!id) throw new BadRequestException();

    const user = await User.findOne({ where: { id } });

    if (user?.photoFn) {
      const filePath = FileManagementUser.getUserPhoto(id, user.photoFn);
      return createReadStream(filePath);
    }

    return createReadStream(FileManagement.storageDir('user.png'));
  }

  async checkUserFieldUniquenessAndThrow(value: {
    [key: string]: any;
  }): Promise<void> {
    const user = await User.findOne({
      where: value,
    });

    const [key] = Object.keys(value);
    if (user) throw new ConflictException(`${key} is not unique`);
  }

  async checkUserFieldUniqueness(value: {
    [key: string]: any;
  }): Promise<boolean> {
    const user = await User.findOne({
      where: value,
    });

    return !user;
  }

  filter(userEntity: User): UserSaveResponseData {
    const { jwtId, hashPwd, photoFn, ...userResponse } = userEntity;

    return { ...userResponse, avatar: `/api/user/photo/${userResponse.id}` };
  }
}
