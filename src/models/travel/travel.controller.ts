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
} from '@nestjs/common';
import { TravelService } from './travel.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import {
  CreateTravelResponse,
  DeleteTravelResponse,
  GetTravelResponse,
  UpdateTravelResponse,
} from '../../types';
import { UserObj } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { TravelOwnerGuard } from '../../common/guards/travel-owner.guard';
import { ReadStream } from 'fs';
import { Travel } from './entities/travel.entity';
import { use } from 'passport';

@Controller('/api/travel')
export class TravelController {
  constructor(private readonly travelService: TravelService) {}

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() createTravelDto: CreateTravelDto,
    @UploadedFile() file: Express.Multer.File,
    @UserObj() user: User,
  ): Promise<CreateTravelResponse> {
    return this.travelService.create(createTravelDto, user, file);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard, TravelOwnerGuard)
  async findOne(@Param('id') id: string): Promise<GetTravelResponse> {
    return this.travelService.findOne(id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard, TravelOwnerGuard)
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
  @UseGuards(JwtAuthGuard, TravelOwnerGuard)
  async remove(
    @Param('id') id: string,
    @UserObj() user: User,
  ): Promise<DeleteTravelResponse> {
    return this.travelService.remove(id, user);
  }

  @Get('/photo/:id')
  @UseGuards(JwtAuthGuard, TravelOwnerGuard)
  @Header('Content-Type', 'image/png')
  @Header('cross-origin-resource-policy', 'cross-origin')
  async getPhoto(
    @Param('id') id: string,
    @UserObj() user: User,
  ): Promise<ReadStream> {
    return this.travelService.getPhoto(id, user);
  }
}
