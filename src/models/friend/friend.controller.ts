import { Controller, Body, Patch, Param, Delete } from '@nestjs/common';
import { FriendService } from './friend.service';
import { UpdateFriendDto } from './dto/update-friend.dto';
import { DeleteFriendResponse, UpdateFriendResponse } from '../../types';

@Controller('/api/friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Patch('/:id')
  update(@Param('id') id: string): Promise<UpdateFriendResponse> {
    return this.friendService.update(id);
  }

  @Delete('/:id')
  remove(@Param('id') id: string): Promise<DeleteFriendResponse> {
    return this.friendService.remove(id);
  }
}
