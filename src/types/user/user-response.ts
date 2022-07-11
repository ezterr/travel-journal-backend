import { UserSaveResponseData } from './user';

export type GetUserResponse = UserSaveResponseData;
export type CreateUserResponse = UserSaveResponseData;
export type UpdateUserResponse = UserSaveResponseData;
export type DeleteUserResponse = UserSaveResponseData;

export interface GetUserStatsResponse {
  travelCount: number;
  postCount: number;
}
