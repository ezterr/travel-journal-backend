import { PostSaveResponseData } from '../post';
import { TravelSaveResponseData } from '../travel';

export interface UserInterface {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  bio: string;
  photoFn: string;
  hashPwd: string;
  jwtId: string;
}

export interface UserPublicDataInterface {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
}

export type UserSaveData = Omit<UserInterface, 'hashPwd'>;
export type UserSaveResponseData = Omit<UserSaveData, 'photoFn' | 'jwtId'> & {
  avatar: string;
};

export type UserIndexSaveData = PostSaveResponseData & { travel: TravelSaveResponseData } & {
  user: UserPublicDataInterface;
};
