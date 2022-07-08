import { PartialType } from '@nestjs/mapped-types';
import { isDefined, IsString, Length, Matches } from 'class-validator';
import { PutUserDto } from './put-user.dto';

export class UpdateUserDto extends PartialType(PutUserDto) {
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

  @IsString({ message: 'bio should be text' })
  @Length(0, 512, {
    message: 'bio should contain at least 0 characters and not more than 512',
  })
  public bio: string;

  @IsString()
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
