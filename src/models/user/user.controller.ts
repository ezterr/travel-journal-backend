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
import { SetOwnerIdParamKey } from '../../common/decorators/set-owner-id-param-key';

@Controller('/api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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

  @Get('/photo/:id')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  @Header('Content-Type', 'image/png')
  @Header('cross-origin-resource-policy', 'cross-origin')
  async getPhoto(@Param('id') id: string): Promise<ReadStream> {
    return this.userService.getPhoto(id);
  }
}
