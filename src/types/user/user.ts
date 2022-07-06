export interface UserInterface {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  hashPwd: string;
  jwtId: string;
}

export type UserSaveData = Omit<UserInterface, 'hashPwd'>;
