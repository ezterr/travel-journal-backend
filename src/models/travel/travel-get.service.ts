import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetTravelResponse, GetTravelsResponse } from '../../types';
import { Travel } from './entities/travel.entity';
import { config } from '../../config/config';
import { createReadStream, ReadStream } from 'fs';
import { FileManagementTravel } from '../../common/utils/file-management/file-management-travel';
import { FileManagement } from '../../common/utils/file-management/file-management';
import { TravelService } from './travel.service';

@Injectable()
export class TravelGetService {
  constructor(
    @Inject(forwardRef(() => TravelService)) private readonly travelService: TravelService,
  ) {}

  async findOne(id: string): Promise<GetTravelResponse> {
    if (!id) throw new BadRequestException();

    const travel = await Travel.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!travel) throw new NotFoundException();

    return this.travelService.filter(travel);
  }

  async findAllByUserId(id: string, page = 1): Promise<GetTravelsResponse> {
    if (!id) throw new BadRequestException();

    const [travels, totalTravelsCount] = await Travel.findAndCount({
      where: { user: { id } },
      relations: ['user'],
      order: { startAt: 'DESC' },
      skip: config.itemsCountPerPage * (page - 1),
      take: config.itemsCountPerPage,
    });

    return {
      travels: travels.map((e) => this.travelService.filter(e)),
      totalPages: Math.ceil(totalTravelsCount / config.itemsCountPerPage),
      totalTravelsCount,
    };
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
}
