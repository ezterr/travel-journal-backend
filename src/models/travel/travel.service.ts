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
import { FileManagement } from '../../common/utils/file-management';
import { FileManagementPost } from '../../common/utils/file-management-post';

@Injectable()
export class TravelService {
  async create(
    createTravelDto: CreateTravelDto,
    userId: string,
    file: Express.Multer.File,
  ): Promise<CreateTravelResponse> {
    try {
      if (!userId) throw new BadRequestException();

      const user = await User.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException();

      const travel = new Travel();
      travel.title = createTravelDto.title;
      travel.description = createTravelDto.description;
      travel.destination = createTravelDto.destination;
      travel.comradesCount = createTravelDto.comradesCount;
      travel.startAt = createTravelDto.startAt ?? travel.startAt;
      travel.endAt = createTravelDto.endAt ?? travel.endAt;

      if (
        new Date(travel.startAt).getTime() > new Date(travel.endAt).getTime()
      ) {
        throw new BadRequestException();
      }

      await travel.save();
      travel.user = user;

      if (file) {
        if (travel.photoFn) {
          await FileManagementTravel.removeTravelPhoto(
            user.id,
            travel.id,
            travel.photoFn,
          );
        }

        const newFile = await FileManagementTravel.saveTravelPhoto(
          user.id,
          travel.id,
          file,
        );
        await FileManagementPost.removeFromTmp(file.filename);
        travel.photoFn = newFile.filename;
      }

      await travel.save();

      return this.filter(travel);
    } catch (e) {
      if (file) await FileManagementUser.removeFromTmp(file.filename);
      throw e;
    }
  }

  async findOne(id: string): Promise<GetTravelResponse> {
    if (!id) throw new BadRequestException();

    const travel = await Travel.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!travel) throw new NotFoundException();

    return this.filter(travel);
  }

  async findAllByUserId(id: string): Promise<GetTravelsResponse> {
    if (!id) throw new BadRequestException();

    const travel = await Travel.find({
      where: { user: { id } },
      relations: ['user'],
      order: { startAt: 'DESC' },
    });

    return travel.map((e) => this.filter(e));
  }

  async update(
    id: string,
    updateTravelDto: UpdateTravelDto,
    file: Express.Multer.File,
  ): Promise<UpdateTravelResponse> {
    try {
      if (!id) throw new BadRequestException();

      const travel = await Travel.findOne({
        where: { id },
        relations: ['user'],
      });
      if (!travel || !travel.user) throw new NotFoundException();

      travel.title = updateTravelDto.title ?? travel.title;
      travel.description = updateTravelDto.description ?? travel.description;
      travel.destination = updateTravelDto.destination ?? travel.destination;
      travel.comradesCount =
        updateTravelDto.comradesCount ?? travel.comradesCount;
      travel.startAt = updateTravelDto.startAt ?? travel.startAt;
      travel.endAt = updateTravelDto.endAt ?? travel.endAt;

      if (
        new Date(travel.startAt).getTime() > new Date(travel.endAt).getTime()
      ) {
        throw new BadRequestException();
      }

      if (file) {
        if (travel.photoFn) {
          await FileManagementTravel.removeTravelPhoto(
            travel.user.id,
            travel.id,
            travel.photoFn,
          );
        }

        const newFile = await FileManagementTravel.saveTravelPhoto(
          travel.user.id,
          travel.id,
          file,
        );
        await FileManagementPost.removeFromTmp(file.filename);

        travel.photoFn = newFile.filename;
      }

      await travel.save();

      return this.filter(travel);
    } catch (e) {
      if (file) await FileManagementUser.removeFromTmp(file.filename);
      throw e;
    }
  }

  async remove(id: string): Promise<DeleteTravelResponse> {
    if (!id) throw new BadRequestException();

    const travel = await Travel.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!travel || !travel.user) throw new NotFoundException();

    await FileManagementTravel.removeTravelDir(travel.user.id, id);
    await travel.remove();

    return this.filter(travel);
  }

  async getPhoto(id: string): Promise<ReadStream> {
    if (!id) throw new BadRequestException();

    const travel = await Travel.findOne({
      where: { id },
      relations: ['user'],
    });

    if (travel?.photoFn && travel.user) {
      const filePath = FileManagementTravel.getTravelPhoto(
        travel.user.id,
        travel.id,
        travel.photoFn,
      );
      return createReadStream(filePath);
    }

    return createReadStream(FileManagement.storageDir('no-image.png'));
  }

  async getCountByUserId(id: string): Promise<number> {
    if (!id) throw new BadRequestException();

    return Travel.count({
      where: { user: { id } },
    });
  }

  filter(travel: Travel): TravelSaveResponseData {
    const { photoFn, user, ...travelResponse } = travel;

    return {
      ...travelResponse,
      photo: `/api/travel/photo/${travelResponse.id}`,
      authorId: user.id,
    };
  }
}
