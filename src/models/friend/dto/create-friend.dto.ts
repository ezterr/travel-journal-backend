import { CreateFriendDtoInterface } from '../../../types';
import { IsString, Length } from 'class-validator';

export class CreateFriendDto implements CreateFriendDtoInterface {
  @IsString()
  @Length(36, 36)
  public friendId: string;
}
