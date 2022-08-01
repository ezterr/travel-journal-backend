import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './common/providers/database/database.module';
import { TravelModule } from './travel/travel.module';
import { PostModule } from './post/post.module';
import { FriendModule } from './friend/friend.module';

@Module({
  imports: [AuthModule, UserModule, DatabaseModule, TravelModule, PostModule, FriendModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
