import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MulterModule } from '@nestjs/platform-express';
import { storageDir } from '../../common/utils/storage-dir';
import { multerStorage } from '../../common/utils/multer-storage';

@Module({
  imports: [
    MulterModule.register({
      storage: multerStorage(storageDir('tmp')),
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
