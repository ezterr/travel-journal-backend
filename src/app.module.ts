import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './models/user/user.module';
import { DatabaseModule } from './providers/database/database.module';
import { TravelModule } from './models/travel/travel.module';

@Module({
  imports: [AuthModule, UserModule, DatabaseModule, TravelModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
