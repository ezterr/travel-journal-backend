import { GetUserResponse } from '../user';

export type LogoutResponse = { ok: boolean };
export type LogoutAllResponse = { ok: boolean };
export type LoginResponse = GetUserResponse;
export type GetUserFromTokenResponse = GetUserResponse;
