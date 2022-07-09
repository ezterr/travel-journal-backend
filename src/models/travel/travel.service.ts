import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import {
  CreateTravelResponse,
  GetTravelResponse,
  TravelSaveResponseData,
  UpdateTravelResponse,
} from '../../types';
import { Travel } from './entities/travel.entity';
import { User } from '../user/entities/user.entity';
import { FileManagementTravel } from '../../common/utils/file-management-travel';
import { createReadStream, ReadStream } from 'fs';

@Injectable()
export class TravelService {
  async create(
    createTravelDto: CreateTravelDto,
    user: User,
    file: Express.Multer.File,
  ): Promise<CreateTravelResponse> {
    const travel = new Travel();
    travel.title = createTravelDto.title;
    travel.description = createTravelDto.description;
    travel.destination = createTravelDto.destination;
    travel.comradesCount = createTravelDto.comradesCount;
    await travel.save();

    travel.user = user;

    if (file) {
      await FileManagementTravel.travelPhotoRemove(
        user.id,
        travel.id,
        file.filename,
      );
      await FileManagementTravel.saveTravelPhoto(user.id, travel.id, file);
      travel.photoFn = file.filename;
    }

    await travel.save();

    return this.filter(travel);
  }

  async findOne(id: string): Promise<GetTravelResponse> {
    if (!id) throw new BadRequestException();

    const travel = await Travel.findOne({ where: { id } });
    if (!travel) throw new NotFoundException();

    return this.filter(travel);
  }

  async update(
    id: string,
    updateTravelDto: UpdateTravelDto,
    file: Express.Multer.File,
  ): Promise<UpdateTravelResponse> {
    if (!id) throw new BadRequestException();

    const travel = await Travel.findOne({
      where: { id },
      relations: ['user'],
    });
    travel.title = updateTravelDto.title ?? travel.title;
    travel.description = updateTravelDto.description ?? travel.description;
    travel.destination = updateTravelDto.destination ?? travel.destination;
    travel.comradesCount =
      updateTravelDto.comradesCount ?? travel.comradesCount;

    if (file && travel.user.id) {
      await FileManagementTravel.travelPhotoRemove(
        travel.user.id,
        travel.id,
        travel.photoFn,
      );
      await FileManagementTravel.saveTravelPhoto(
        travel.user.id,
        travel.id,
        file,
      );
      travel.photoFn = file.filename;
    }

    await travel.save();

    return this.filter(travel);
  }

  remove(id: number) {
    return `This action removes a #${id} travel`;
  }

  async getPhoto(id: string): Promise<ReadStream> {
    if (!id) throw new BadRequestException();

    const travel = await Travel.findOne({
      where: { id },
      relations: ['user'],
    });

    if (travel?.photoFn && travel?.user.id) {
      const filePath = FileManagementTravel.travelPhotoGet(
        travel.user.id,
        travel.id,
        travel.photoFn,
      );
      return createReadStream(filePath);
    }

    throw new NotFoundException();
  }

  filter(travel: Travel): TravelSaveResponseData {
    const { photoFn, user, ...travelResponse } = travel;

    return { ...travelResponse, photo: `/api/user/photo/${travelResponse.id}` };
  }
}
