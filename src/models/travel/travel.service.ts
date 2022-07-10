import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import {
  CreateTravelResponse,
  DeleteTravelResponse,
  GetTravelResponse,
  GetTravelsResponse,
  TravelSaveResponseData,
  UpdateTravelResponse,
} from '../../types';
import { Travel } from './entities/travel.entity';
import { User } from '../user/entities/user.entity';
import { FileManagementTravel } from '../../common/utils/file-management-travel';
import { createReadStream, ReadStream } from 'fs';
import { FileManagementUser } from '../../common/utils/file-management-user';

@Injectable()
export class TravelService {
  async create(
    createTravelDto: CreateTravelDto,
    user: User,
    file: Express.Multer.File,
  ): Promise<CreateTravelResponse> {
    try {
      if (!user) throw new BadRequestException();

      const travel = new Travel();
      travel.title = createTravelDto.title;
      travel.description = createTravelDto.description;
      travel.destination = createTravelDto.destination;
      travel.comradesCount = createTravelDto.comradesCount;
      travel.travelStartAt =
        createTravelDto.travelStartAt ?? travel.travelStartAt;
      travel.travelEndAt = createTravelDto.travelEndAt ?? travel.travelEndAt;

      if (
        new Date(travel.travelStartAt).getTime() >
        new Date(travel.travelEndAt).getTime()
      ) {
        throw new BadRequestException();
      }

      await travel.save();
      travel.user = user;

      if (file) {
        await FileManagementTravel.removeTravelPhoto(
          user.id,
          travel.id,
          file.filename,
        );
        await FileManagementTravel.saveTravelPhoto(user.id, travel.id, file);
        travel.photoFn = file.filename;
      }

      await travel.save();

      return this.filter(travel);
    } catch (e) {
      await FileManagementUser.removeFromTmp(file.filename);
      throw e;
    }
  }

  async findOne(id: string): Promise<GetTravelResponse> {
    if (!id) throw new BadRequestException();

    const travel = await Travel.findOne({ where: { id } });
    if (!travel) throw new NotFoundException();

    return this.filter(travel);
  }

  async findAllByUserId(id: string): Promise<GetTravelsResponse> {
    if (!id) throw new BadRequestException();

    const travel = await Travel.find({
      where: { user: { id } },
    });

    return travel.map((e) => this.filter(e));
  }

  async update(
    id: string,
    user: User,
    updateTravelDto: UpdateTravelDto,
    file: Express.Multer.File,
  ): Promise<UpdateTravelResponse> {
    try {
      if (!id || !user) throw new BadRequestException();

      const travel = await Travel.findOne({ where: { id } });
      if (!travel) throw new NotFoundException();

      travel.title = updateTravelDto.title ?? travel.title;
      travel.description = updateTravelDto.description ?? travel.description;
      travel.destination = updateTravelDto.destination ?? travel.destination;
      travel.comradesCount =
        updateTravelDto.comradesCount ?? travel.comradesCount;
      travel.travelStartAt =
        updateTravelDto.travelStartAt ?? travel.travelStartAt;
      travel.travelEndAt = updateTravelDto.travelEndAt ?? travel.travelEndAt;

      if (
        new Date(travel.travelStartAt).getTime() >
        new Date(travel.travelEndAt).getTime()
      ) {
        throw new BadRequestException();
      }

      if (file) {
        await FileManagementTravel.removeTravelPhoto(
          user.id,
          travel.id,
          travel.photoFn,
        );
        await FileManagementTravel.saveTravelPhoto(user.id, travel.id, file);
        travel.photoFn = file.filename;
      }

      await travel.save();

      return this.filter(travel);
    } catch (e) {
      await FileManagementUser.removeFromTmp(file.filename);
      throw e;
    }
  }

  async remove(id: string, user: User): Promise<DeleteTravelResponse> {
    if (!id || !user) throw new BadRequestException();

    const travel = await Travel.findOne({ where: { id } });
    if (!travel) throw new NotFoundException();

    await FileManagementTravel.removeTravelDir(user.id, id);
    await travel.remove();

    return this.filter(travel);
  }

  async getPhoto(id: string, user: User): Promise<ReadStream> {
    if (!id || !user) throw new BadRequestException();

    const travel = await Travel.findOne({
      where: { id },
    });

    if (travel?.photoFn) {
      const filePath = FileManagementTravel.getTravelPhoto(
        user.id,
        travel.id,
        travel.photoFn,
      );
      return createReadStream(filePath);
    }

    throw new NotFoundException();
  }

  filter(travel: Travel): TravelSaveResponseData {
    const { photoFn, user, ...travelResponse } = travel;

    return {
      ...travelResponse,
      photo: `/api/travel/photo/${travelResponse.id}`,
    };
  }
}
