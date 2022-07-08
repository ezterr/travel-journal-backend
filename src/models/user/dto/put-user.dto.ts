import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class PutUserDto {
  @IsString({ message: 'first name should be text' })
  @Length(2, 64, {
    message:
      'first name should contain at least 2 characters and not more than 64',
  })
  public firstName: string;

  @IsString({ message: 'last name should be text' })
  @Length(2, 64, {
    message:
      'last name should contain at least 2 characters and not more than 64',
  })
  public lastName: string;

  @IsString({ message: 'username should be text' })
  @Length(2, 64, {
    message:
      'username should contain at least 2 characters and not more than 64',
  })
  public username: string;

  @IsString({ message: 'bio should be text' })
  @Length(0, 512, {
    message: 'bio should contain at least 0 characters and not more than 512',
  })
  public bio: string;

  @IsEmail()
  @Length(3, 255, {
    message: 'email should contain at least 3 characters and not more than 255',
  })
  public email: string;

  @IsString({ message: 'password should be text' })
  public password: string;

  @IsString({ message: 'password should be text' })
  @Length(8, 36, {
    message:
      'password should contain at least 2 characters and not more than 64',
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'password should contain at least one uppercase and one lowercase letter and one digit or special character',
  })
  public newPassword: string;

  public avatar: any;
}
