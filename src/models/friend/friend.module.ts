import { forwardRef, Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { UserModule } from '../user/user.module';
import { FriendGetService } from './friend-get.service';

@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [FriendController],
  providers: [FriendService, FriendGetService],
  exports: [FriendService, FriendGetService],
})
export class FriendModule {}
