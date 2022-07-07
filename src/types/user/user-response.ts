import { UserSaveData, UserSaveResponseData } from './user';

export type GetUserResponse = Omit<UserSaveData, 'jwtId'>;
export type CreateUserResponse = UserSaveResponseData;
export type UpdateUserResponse = UserSaveResponseData;
export type DeleteUserResponse = UserSaveResponseData;
