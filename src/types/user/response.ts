import { UserSaveData } from './user';

export type GetUserResponse = Omit<UserSaveData, 'jwtId'>;
export type CreateUserResponse = Omit<UserSaveData, 'jwtId'>;
export type UpdateUserResponse = Omit<UserSaveData, 'jwtId'>;
