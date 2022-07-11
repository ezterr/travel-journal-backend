export interface CreateUserDtoInterface {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserDtoInterface {
  firstName?: string;
  lastName?: string;
  bio?: string;
  password?: string;
  newPassword?: string;
  photo?: any;
}
