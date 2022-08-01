import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { IsString, Length } from 'class-validator';
import { UpdatePostDtoInterface } from '../../types';

export class UpdatePostDto extends PartialType(CreatePostDto) implements UpdatePostDtoInterface {
  @IsString()
  @Length(2, 64)
  public title: string;

  @IsString()
  @Length(2, 64)
  public destination: string;

  @IsString()
  @Length(0, 512)
  public description: string;

  public photo: any;
}
