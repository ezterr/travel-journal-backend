import { User } from '../../models/user/entities/user.entity';

export interface FriendInterface {
  id: string;
  user: User;
  friend: User;
  status: FriendStatus;
}

export enum FriendStatus {
  Waiting = 'waiting',
  Accepted = 'accepted',
  Invitation = 'invitation',
}

export type FriendSaveResponseData = Omit<FriendInterface, 'user' | 'friend'> & {
  userId: string;
  friendId: string;
};
