import { FriendSaveResponseData } from './friend';

export type CreateFriendResponse = FriendSaveResponseData;
export type GetFriendsResponse = {
  friends: FriendSaveResponseData[];
  totalPages: number;
  totalFriendsCount: number;
};
export type UpdateFriendResponse = FriendSaveResponseData;
export type DeleteFriendResponse = FriendSaveResponseData;
