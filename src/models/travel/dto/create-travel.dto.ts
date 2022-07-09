import {
  IsDate,
  IsDateString,
  IsInt,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { MoreThan } from 'typeorm';

export class CreateTravelDto {
  @IsString()
  @Length(2, 128)
  public title: string;

  @IsString()
  @Length(0, 512)
  public description: string;

  @IsString()
  @Length(2, 128)
  public destination: string;

  @IsInt()
  @Min(0)
  @Max(9999)
  public comradesCount: number;

  @IsDateString()
  public travelStartAt;

  @IsDateString()
  public travelEndAt;

  public photo: any;
}
