import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MulterModule } from '@nestjs/platform-express';
import { multerStorage } from '../../common/utils/multer-storage';
import { FileManagement } from '../../common/utils/file-management/file-management';
import { PostGetService } from './post-get.service';

@Module({
  imports: [
    MulterModule.register({
      storage: multerStorage(FileManagement.storageDir('tmp')),
    }),
  ],
  controllers: [PostController],
  providers: [PostService, PostGetService],
  exports: [PostService, PostGetService],
})
export class PostModule {}
