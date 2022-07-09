import { Module } from '@nestjs/common';
import { TravelService } from './travel.service';
import { TravelController } from './travel.controller';
import { MulterModule } from '@nestjs/platform-express';
import { multerStorage } from '../../common/utils/multer-storage';
import { storageDir } from '../../common/utils/storage-dir';

@Module({
  imports: [
    MulterModule.register({
      storage: multerStorage(storageDir('tmp')),
    }),
  ],
  controllers: [TravelController],
  providers: [TravelService],
})
export class TravelModule {}
