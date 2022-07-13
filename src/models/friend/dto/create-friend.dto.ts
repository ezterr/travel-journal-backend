import { CreateFriendDtoInterface } from '../../../types/friend/friend.dto';
import { IsString, Length } from 'class-validator';

export class CreateFriendDto implements CreateFriendDtoInterface {
  @IsString()
  @Length(36, 36)
  public friendId: string;
}
