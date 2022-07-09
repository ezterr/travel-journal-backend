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
import { createReadStream } from 'fs';
import { storageDir } from '../../common/utils/storage-dir';

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
      try {
        await FileManagement.userAvatarRemove(id, user.photoFn);
      } catch (err) {}

      await FileManagement.userAvatarSave(id, file);
      user.photoFn = file.filename;
    }

    await user.save();

    return this.filter(user);
  }

  async remove(id: string): Promise<DeleteUserResponse> {
    if (!id) throw new BadRequestException();

    const user = await User.findOne({ where: { id } });
    if (!user) throw new NotFoundException();

    if (user.photoFn) {
      try {
        await FileManagement.userFilesRemove(id);
      } catch (err) {}
    }

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

  async getAvatar(id: string) {
    if (!id) throw new BadRequestException();

    const user = await User.findOne({ where: { id } });
    if (user?.photoFn) {
      const filePath = FileManagement.userAvatarGet(id, user.photoFn);
      return createReadStream(filePath);
    }

    return createReadStream(storageDir('user.png'));
  }
}
