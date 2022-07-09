import { IsDateString, IsString, Length } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @Length(2, 128)
  public title: string;

  @IsString()
  @Length(2, 128)
  public destination: string;

  @IsString()
  @Length(0, 512)
  public description: string;

  public photo: string;
}
