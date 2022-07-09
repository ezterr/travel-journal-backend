import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../models/user/entities/user.entity';
import { Travel } from '../../models/travel/entities/travel.entity';

export class TravelOwnerGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const travelId = request.params?.id;

    if (!travelId) throw new BadRequestException();
    if (!user) throw new Error('user is undefined');

    const travel = await Travel.findOne({
      where: { id: travelId },
      relations: ['user'],
      select: ['id', 'user'],
    });

    if (!travel) throw new NotFoundException();

    return travel.user.id === user.id;
  }
}
