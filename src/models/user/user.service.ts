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
  UpdateUserResponse,
} from '../../types';
import { createHashPwd } from '../../common/utils/create-hash-pwd';
import { UserSaveResponseData } from '../../types';
import { Express } from 'express';
import { FileManagement } from '../../common/utils/file-management';
import { join } from 'path';
import { createReadStream } from 'fs';

@Injectable()
export class UserService {
  async create(createUserDto: CreateUserDto): Promise<CreateUserResponse> {
    await this.checkUserFieldUniquenessAndThrow({ email: createUserDto.email });
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

    return this.filter(user);
  }

  async findOne(userId: string): Promise<GetUserResponse> {
    if (!userId) throw new BadRequestException();

    const user = await User.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    return this.filter(user);
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
    file: Express.Multer.File,
  ): Promise<UpdateUserResponse> {
    if (!userId) throw new BadRequestException();

    const user = await User.findOne({ where: { id: userId } });
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
      try {
        await FileManagement.userAvatarRemove(userId, user.photoFn);
      } catch (err) {}

      await FileManagement.userAvatarSave(userId, file);
      user.photoFn = file.filename;
    }

    await user.save();

    return this.filter(user);
  }

  async remove(userId: string): Promise<DeleteUserResponse> {
    if (!userId) throw new BadRequestException();

    const user = await User.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    await user.remove();

    return this.filter(user);
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

  async getAvatar(userId: string) {
    if (!userId) throw new BadRequestException();

    const user = await User.findOne({ where: { id: userId } });
    if (!user?.photoFn) throw new NotFoundException();

    const filePath = FileManagement.userAvatarGet(userId, user.photoFn);

    return createReadStream(filePath);
  }
}
