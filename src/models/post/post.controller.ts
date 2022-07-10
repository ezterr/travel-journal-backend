import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Header,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Multer } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserObj } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { TravelOwnerGuard } from '../../common/guards/travel-owner.guard';
import { ReadStream } from 'fs';
import { PostOwnerGuard } from '../../common/guards/post-owner.guard';

@Controller('/api/post')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/:id')
  @UseGuards(PostOwnerGuard)
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PostOwnerGuard)
  @UseInterceptors(FileInterceptor('photo'))
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @UserObj() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.postService.update(id, user, updatePostDto, file);
  }

  @Delete(':id')
  @UseGuards(PostOwnerGuard)
  remove(@Param('id') id: string, @UserObj() user: User) {
    return this.postService.remove(id, user);
  }

  @Get('/photo/:id')
  @UseGuards(PostOwnerGuard)
  @Header('Content-Type', 'image/png')
  @Header('cross-origin-resource-policy', 'cross-origin')
  async getPhoto(
    @Param('id') id: string,
    @UserObj() user: User,
  ): Promise<ReadStream> {
    return this.postService.getPhoto(id, user);
  }
}
