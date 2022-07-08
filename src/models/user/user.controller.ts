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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountOwnerGuard } from '../../common/guards/account-owner.guard';
import {
  CreateUserResponse,
  DeleteUserResponse,
  GetUserResponse,
  UpdateUserResponse,
} from '../../types';
import { ReadStream } from 'fs';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('/api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/')
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<CreateUserResponse> {
    return this.userService.create(createUserDto);
  }

  @Get('/:userId')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  async findOne(@Param('userId') userId: string): Promise<GetUserResponse> {
    return this.userService.findOne(userId);
  }

  @Delete('/:userId')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  async remove(@Param('userId') userId: string): Promise<DeleteUserResponse> {
    return this.userService.remove(userId);
  }

  @Patch('/:userId')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('userId') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UpdateUserResponse> {
    return this.userService.update(id, updateUserDto, file);
  }

  @Get('/photo/:userId')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  @Header('Content-Type', 'image/png')
  @Header('cross-origin-resource-policy', 'cross-origin')
  async getAvatar(@Param('userId') userId: string): Promise<ReadStream> {
    return this.userService.getAvatar(userId);
  }
}
