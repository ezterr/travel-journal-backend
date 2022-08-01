import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class PutUserDto {
  @IsString()
  @Length(2, 64)
  public firstName: string;

  @IsString()
  @Length(2, 64)
  public lastName: string;

  @IsString()
  @Length(2, 64)
  public username: string;

  @IsString()
  @Length(0, 512)
  public bio: string;

  @IsEmail()
  @Length(3, 255)
  public email: string;

  @IsString()
  public password: string;

  @IsString()
  @Length(8, 36)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
  public newPassword: string;

  public photo: any;
}
