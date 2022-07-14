import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Header,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { TravelService } from './travel.service';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import {
  CreatePostResponse,
  DeleteTravelResponse,
  GetPostsResponse,
  GetTravelResponse,
  UpdateTravelResponse,
} from '../../types';
import { TravelOwnerGuard } from '../../common/guards/travel-owner.guard';
import { ReadStream } from 'fs';
import { CreatePostDto } from '../post/dto/create-post.dto';
import { PostService } from '../post/post.service';
import { UserService } from '../user/user.service';

@Controller('/api/travel')
@UseGuards(JwtAuthGuard)
export class TravelController {
  constructor(
    @Inject(forwardRef(() => TravelService)) private readonly travelService: TravelService,
    @Inject(forwardRef(() => PostService)) private readonly postService: PostService,
  ) {}

  @Get('/:id')
  @UseGuards() //guar przyjaciele
  async findOne(@Param('id') id: string): Promise<GetTravelResponse> {
    return this.travelService.findOne(id);
  }

  @Patch('/:id')
  @UseGuards(TravelOwnerGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('id') id: string,
    @Body() updateTravelDto: UpdateTravelDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UpdateTravelResponse> {
    return this.travelService.update(id, updateTravelDto, file);
  }

  @Delete('/:id')
  @UseGuards(TravelOwnerGuard)
  async remove(@Param('id') id: string): Promise<DeleteTravelResponse> {
    return this.travelService.remove(id);
  }

  @Get('/photo/:id')
  @UseGuards() //guard znajomi
  @Header('Content-Type', 'image/png')
  @Header('cross-origin-resource-policy', 'cross-origin')
  async getPhoto(@Param('id') id: string): Promise<ReadStream> {
    return this.travelService.getPhoto(id);
  }

  @Post('/:id/post')
  @UseGuards(TravelOwnerGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CreatePostResponse> {
    return this.postService.create(id, createPostDto, file);
  }

  @Get('/:id/post')
  @UseGuards() //guard znajomi
  async findAllPosts(@Param('id') id: string): Promise<GetPostsResponse> {
    return this.postService.findAllByTravelId(id);
  }
}
