import { IsString, Length } from 'class-validator';
import { CreatePostDtoInterface } from '../../../types';

export class CreatePostDto implements CreatePostDtoInterface {
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
