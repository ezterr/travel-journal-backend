import { ConflictException, Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserPublicDataInterface, UserSaveResponseData } from '../types';

@Injectable()
export class UserHelperService {
  async checkUserFieldUniquenessAndThrow(value: { [key: string]: any }): Promise<void> {
    const user = await User.findOne({
      where: value,
    });

    const [key] = Object.keys(value);
    if (user) throw new ConflictException(`${key} is not unique`);
  }

  async checkUserFieldUniqueness(value: { [key: string]: any }): Promise<boolean> {
    const user = await User.findOne({
      where: value,
    });

    return !user;
  }

  filter(userEntity: User): UserSaveResponseData {
    const { jwtId, hashPwd, photoFn, travels, friends, friendsRevert, ...userResponse } =
      userEntity;

    return { ...userResponse, avatar: `/user/photo/${userResponse.id}` };
  }

  filterPublicData(userEntity: User): UserPublicDataInterface {
    const {
      jwtId,
      hashPwd,
      photoFn,
      email,
      bio,
      travels,
      friends,
      friendsRevert,
      ...userResponse
    } = userEntity;

    return { ...userResponse, avatar: `/user/photo/${userResponse.id}` };
  }
}
