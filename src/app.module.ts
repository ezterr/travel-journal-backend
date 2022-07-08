import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './models/user/user.module';
import { DatabaseModule } from './providers/database/database.module';
import { MulterModule } from '@nestjs/platform-express';
import { multerStorage } from './common/utils/multer-storage';
import { storageDir } from './common/utils/storage-dir';

@Module({
  imports: [AuthModule, UserModule, DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
