import { UserIndexSaveData, UserPublicDataInterface, UserSaveResponseData } from './user';

export type GetUserSearchResponse = UserPublicDataInterface[];
export type GetUserResponse = UserSaveResponseData;
export type CreateUserResponse = UserSaveResponseData;
export type UpdateUserResponse = UserSaveResponseData;
export type DeleteUserResponse = UserSaveResponseData;

export type GetUserIndexResponse = {
  posts: UserIndexSaveData[];
  totalPages: number;
  totalPostsCount: number;
};

export interface GetUserStatsResponse {
  travelCount: number;
  postCount: number;
}
