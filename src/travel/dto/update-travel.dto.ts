import { PartialType } from '@nestjs/mapped-types';
import { CreateTravelDto } from './create-travel.dto';
import { IsDateString, IsInt, IsString, Length, Max, Min } from 'class-validator';
import { UpdateTravelDtoInterface } from '../../types';

export class UpdateTravelDto
  extends PartialType(CreateTravelDto)
  implements UpdateTravelDtoInterface
{
  @IsString()
  @Length(2, 64)
  public title: string;

  @IsString()
  @Length(0, 512)
  public description: string;

  @IsString()
  @Length(2, 64)
  public destination: string;

  @IsInt()
  @Min(0)
  @Max(9999)
  public comradesCount: number;

  @IsDateString()
  public startAt: string;

  @IsDateString()
  public endAt: string;

  public photo: any;
}
