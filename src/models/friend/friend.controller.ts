import { Controller, Body, Patch, Param, Delete } from '@nestjs/common';
import { FriendService } from './friend.service';
import { UpdateFriendDto } from './dto/update-friend.dto';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFriendDto: UpdateFriendDto) {
    return this.friendService.update(+id, updateFriendDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.friendService.remove(+id);
  }
}
