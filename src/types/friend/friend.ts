import { User } from '../../models/user/entities/user.entity';

export interface FriendInterface {
  id: string;
  createdAt: Date;
  user: User;
  friend: User;
  status: FriendStatus;
}

export enum FriendStatus {
  Waiting = 'Waiting',
  Accepted = 'Accepted',
}

export type FriendSaveResponseData = Omit<
  FriendInterface,
  'user' | 'friend'
> & {
  userId: string;
  friendId: string;
};
