import {
  BadRequestException,
  forwardRef,
  Inject,
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
  GetUserStatsResponse,
  UpdateUserResponse,
} from '../../types';
import { createHashPwd } from '../../common/utils/create-hash-pwd';
import { Express } from 'express';
import { FileManagementUser } from '../../common/utils/file-management/file-management-user';
import { createReadStream } from 'fs';
import { FileManagement } from '../../common/utils/file-management/file-management';
import { PostService } from '../post/post.service';
import { TravelService } from '../travel/travel.service';
import { DataSource } from 'typeorm';
import { FriendService } from '../friend/friend.service';
import { UserHelperService } from './user-helper.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => UserHelperService))
    private readonly userHelperService: UserHelperService,
    @Inject(forwardRef(() => TravelService)) private readonly travelService: TravelService,
    @Inject(forwardRef(() => PostService)) private readonly postService: PostService,
    @Inject(forwardRef(() => FriendService)) private readonly friendService: FriendService,
    @Inject(forwardRef(() => DataSource)) private dataSource: DataSource,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    file: Express.Multer.File,
  ): Promise<CreateUserResponse> {
    try {
      await this.userHelperService.checkUserFieldUniquenessAndThrow({
        email: createUserDto.email,
      });
      await this.userHelperService.checkUserFieldUniquenessAndThrow({
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

      return this.userHelperService.filter(user);
    } catch (e) {
      if (file) await FileManagementUser.removeFromTmp(file.filename);
      throw e;
    }
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
          const hashCompareResult = await compare(updateUserDto.password, user.hashPwd);

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

      return this.userHelperService.filter(user);
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

    return this.userHelperService.filter(user);
  }
}
