import { UserInterface } from '../user';

export interface FriendInterface {
  id: string;
  user: UserInterface;
  friend: UserInterface;
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
