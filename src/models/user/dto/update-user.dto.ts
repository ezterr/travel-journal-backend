import { PartialType } from '@nestjs/mapped-types';
import { IsString, Length, Matches } from 'class-validator';
import { PutUserDto } from './put-user.dto';
import { UpdateUserDtoInterface } from '../../../types/user/user.dto';

export class UpdateUserDto
  extends PartialType(PutUserDto)
  implements UpdateUserDtoInterface
{
  @IsString()
  @Length(2, 64)
  public firstName: string;

  @IsString()
  @Length(2, 64)
  public lastName: string;

  @IsString()
  @Length(0, 512)
  public bio: string;

  @IsString()
  public password: string;

  @IsString()
  @Length(8, 36)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
  public newPassword: string;

  public photo: any;
}
