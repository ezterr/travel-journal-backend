import { forwardRef, Module } from '@nestjs/common';
import { TravelService } from './travel.service';
import { TravelController } from './travel.controller';
import { MulterModule } from '@nestjs/platform-express';
import { multerStorage } from '../../common/utils/multer-storage';
import { FileManagement } from '../../common/utils/file-management/file-management';
import { PostModule } from '../post/post.module';
import { TravelGetService } from './travel-get.service';

@Module({
  imports: [
    MulterModule.register({
      storage: multerStorage(FileManagement.storageDir('tmp')),
    }),
    forwardRef(() => PostModule),
  ],
  controllers: [TravelController],
  providers: [TravelService, TravelGetService],
  exports: [TravelService, TravelGetService],
})
export class TravelModule {}
