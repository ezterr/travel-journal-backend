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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountOwnerGuard } from '../../common/guards/account-owner.guard';
import {
  CreateTravelResponse,
  CreateUserResponse,
  DeleteUserResponse,
  GetFriendsResponse,
  GetTravelsResponse,
  GetUserResponse,
  GetUserStatsResponse,
  UpdateUserResponse,
} from '../../types';
import { ReadStream } from 'fs';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { TravelService } from '../travel/travel.service';
import { CreateTravelDto } from '../travel/dto/create-travel.dto';
import { CreateFriendDto } from '../friend/dto/create-friend.dto';
import { CreateFriendResponse } from '../../types';
import { FriendService } from '../friend/friend.service';

@Controller('/api/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly travelService: TravelService,
    private readonly friendService: FriendService,
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
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  async findOne(@Param('id') id: string): Promise<GetUserResponse> {
    return this.userService.findOne(id);
  }

  @Get('/:id/search')
  @UseGuards(JwtAuthGuard)
  async searchUser(@Query('search') search: string, @Query('friends') friends: boolean) {
    return this.userService.searchUser();
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  async remove(@Param('id') id: string): Promise<DeleteUserResponse> {
    return this.userService.remove(id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UpdateUserResponse> {
    return this.userService.update(id, updateUserDto, file);
  }

  @Get('/:id/stats')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  async getStats(@Param('id') id: string): Promise<GetUserStatsResponse> {
    return this.userService.getStats(id);
  }

  @Get('/photo/:id')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  @Header('Content-Type', 'image/png')
  @Header('cross-origin-resource-policy', 'cross-origin')
  async getPhoto(@Param('id') id: string): Promise<ReadStream> {
    return this.userService.getPhoto(id);
  }

  @Get('/:id/travel')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  async findAllTravel(@Param('id') id: string): Promise<GetTravelsResponse> {
    return this.travelService.findAllByUserId(id);
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
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  async createFriendship(
    @Body() createFriendDto: CreateFriendDto,
    @Param('id') id: string,
  ): Promise<CreateFriendResponse> {
    return this.friendService.create(id, createFriendDto);
  }

  @Get('/:id/friend')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
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
