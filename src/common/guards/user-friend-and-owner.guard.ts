import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../models/user/entities/user.entity';
import { DataSource } from 'typeorm';
import { Friend } from '../../models/friend/entities/friend.entity';

@Injectable()
export class UserFriendAndOwnerGuard implements CanActivate {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const ownerId = request.params?.id;
    const user = request.user as User;

    if (!ownerId) throw new BadRequestException();
    if (!user) throw new Error('User is undefined');

    const friend = await this.dataSource
      .createQueryBuilder()
      .select(['friend.id', 'userFriend.id'])
      .from(Friend, 'friend')
      .leftJoin('friend.friend', 'userFriend')
      .where('`friend`.`userId`=:id AND `friend`.`status`="accepted"', { id: ownerId })
      .getOne();

    return user.id === ownerId || user.id === friend.friend.id;
  }
}
