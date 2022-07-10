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
} from '@nestjs/common';
import { TravelService } from './travel.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import {
  CreatePostResponse,
  CreateTravelResponse,
  DeleteTravelResponse,
  GetPostsResponse,
  GetTravelResponse,
  UpdateTravelResponse,
} from '../../types';
import { UserObj } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { TravelOwnerGuard } from '../../common/guards/travel-owner.guard';
import { ReadStream } from 'fs';
import { Travel } from './entities/travel.entity';
import { use } from 'passport';
import { CreatePostDto } from '../post/dto/create-post.dto';
import { PostService } from '../post/post.service';

@Controller('/api/travel')
@UseGuards(JwtAuthGuard)
export class TravelController {
  constructor(
    private readonly travelService: TravelService,
    private readonly postService: PostService,
  ) {}

  @Get('/:id')
  @UseGuards(TravelOwnerGuard)
  async findOne(@Param('id') id: string): Promise<GetTravelResponse> {
    return this.travelService.findOne(id);
  }

  @Patch('/:id')
  @UseGuards(TravelOwnerGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('id') id: string,
    @Body() updateTravelDto: UpdateTravelDto,
    @UserObj() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UpdateTravelResponse> {
    return this.travelService.update(id, user, updateTravelDto, file);
  }

  @Delete('/:id')
  @UseGuards(TravelOwnerGuard)
  async remove(
    @Param('id') id: string,
    @UserObj() user: User,
  ): Promise<DeleteTravelResponse> {
    return this.travelService.remove(id, user);
  }

  @Get('/photo/:id')
  @UseGuards(TravelOwnerGuard)
  @Header('Content-Type', 'image/png')
  @Header('cross-origin-resource-policy', 'cross-origin')
  async getPhoto(
    @Param('id') id: string,
    @UserObj() user: User,
  ): Promise<ReadStream> {
    return this.travelService.getPhoto(id, user);
  }

  @Post('/:id/post')
  @UseGuards(TravelOwnerGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @Param('id') id: string,
    @UserObj() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CreatePostResponse> {
    return this.postService.create(id, user, createPostDto, file);
  }
  //@TODO zamienić user na userId
  @Get('/:id/post')
  @UseGuards(TravelOwnerGuard)
  async findAllPosts(@Param('id') id: string): Promise<GetPostsResponse> {
    return this.postService.findAllByTravelId(id);
  }
}
