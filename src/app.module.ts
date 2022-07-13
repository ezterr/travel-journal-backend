import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './models/user/user.module';
import { DatabaseModule } from './providers/database/database.module';
import { TravelModule } from './models/travel/travel.module';
import { PostModule } from './models/post/post.module';
import { FriendModule } from './models/friend/friend.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    DatabaseModule,
    TravelModule,
    PostModule,
    FriendModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
