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
  Header,
  UploadedFile,
  Query,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserOwnerGuard } from '../../common/guards/user-owner.guard';
import {
  CreateTravelResponse,
  CreateUserResponse,
  DeleteUserResponse,
  GetFriendsResponse,
  GetTravelsResponse,
  GetUserIndexResponse,
  GetUserResponse,
  GetUserSearchResponse,
  GetUserStatsResponse,
  UpdateUserResponse,
  UserPublicDataInterface,
} from '../../types';
import { ReadStream } from 'fs';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { TravelService } from '../travel/travel.service';
import { CreateTravelDto } from '../travel/dto/create-travel.dto';
import { CreateFriendDto } from '../friend/dto/create-friend.dto';
import { CreateFriendResponse } from '../../types';
import { FriendService } from '../friend/friend.service';
import { TravelOwnerGuard } from '../../common/guards/travel-owner.guard';
import { UserFriendAndOwnerGuard } from '../../common/guards/user-friend-and-owner.guard';

@Controller('/api/user')
export class UserController {
  constructor(
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @Inject(forwardRef(() => TravelService)) private readonly travelService: TravelService,
    @Inject(forwardRef(() => FriendService)) private readonly friendService: FriendService,
  ) {}

  @Post('/')
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CreateUserResponse> {
    return this.userService.create(createUserDto, file);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard, UserFriendAndOwnerGuard)
  async findOne(@Param('id') id: string): Promise<GetUserResponse> {
    return this.userService.findOne(id);
  }

  @Get('/:id/index')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async getIndex(
    @Param('id') id: string,
    @Query('page') page: number,
  ): Promise<GetUserIndexResponse> {
    return this.userService.getIndex(id, page || 1);
  }

  @Get('/:id/search')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async searchUser(
    @Param('id') id: string,
    @Query('search') search: string,
    @Query('friends') friends: boolean,
  ): Promise<GetUserSearchResponse> {
    return this.userService.searchUser(id, search, friends);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async remove(@Param('id') id: string): Promise<DeleteUserResponse> {
    return this.userService.remove(id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UpdateUserResponse> {
    return this.userService.update(id, updateUserDto, file);
  }

  @Get('/:id/stats')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async getStats(@Param('id') id: string): Promise<GetUserStatsResponse> {
    return this.userService.getStats(id);
  }

  @Get('/photo/:id')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'image/png')
  @Header('cross-origin-resource-policy', 'cross-origin')
  async getPhoto(@Param('id') id: string): Promise<ReadStream> {
    return this.userService.getPhoto(id);
  }

  @Get('/:id/travel')
  @UseGuards(JwtAuthGuard, UserFriendAndOwnerGuard)
  async findAllTravel(
    @Param('id') id: string,
    @Query('page') page: number,
  ): Promise<GetTravelsResponse> {
    return this.travelService.findAllByUserId(id, page || 1);
  }

  @Post('/:id/travel')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createTravel(
    @Body() createTravelDto: CreateTravelDto,
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
  ): Promise<CreateTravelResponse> {
    return this.travelService.create(createTravelDto, id, file);
  }

  @Post('/:id/friend')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async createFriendship(
    @Body() createFriendDto: CreateFriendDto,
    @Param('id') id: string,
  ): Promise<CreateFriendResponse> {
    return this.friendService.create(id, createFriendDto);
  }

  @Get('/:id/friend')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async getAllFriendshipByUserId(
    @Param('id') id: string,
    @Query('waiting') waiting: boolean,
    @Query('accepted') accepted: boolean,
    @Query('invitation') invitation: boolean,
  ): Promise<GetFriendsResponse> {
    return this.friendService.findAllByUserId(id, {
      waiting,
      accepted,
      invitation,
    });
  }
}
