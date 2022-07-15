import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Friend } from './entities/friend.entity';
import { GetFriendsResponse } from '../../types';
import { config } from '../../config/config';
import { DataSource } from 'typeorm';
import { FriendService } from './friend.service';

interface StatusObj {
  waiting?: boolean;
  accepted?: boolean;
  invitation?: boolean;
}

type friendshipTwoSite = { friendshipUser: Friend; friendshipFriend: Friend };

@Injectable()
export class FriendGetService {
  constructor(
    @Inject(forwardRef(() => FriendService)) private readonly friendService: FriendService,
    @Inject(forwardRef(() => DataSource)) private readonly dataSource: DataSource,
  ) {}

  async findAllByUserId(id: string, page = 1, statusObj?: StatusObj): Promise<GetFriendsResponse> {
    if (!id) throw new BadRequestException();

    const activeStatus = Object.entries(
      statusObj ?? {
        waiting: true,
        accepted: true,
        invitation: true,
      },
    )
      .filter((e) => e[1])
      .map((e) => e[0]);

    const [friendship, totalFriendsCount] = await this.dataSource
      .createQueryBuilder()
      .select(['friendship', 'friend', 'user'])
      .from(Friend, 'friendship')
      .leftJoin('friendship.user', 'user')
      .leftJoin('friendship.friend', 'friend')
      .where('friendship.userId=:id', { id })
      .andWhere('friendship.status IN (:...status)', {
        status: [...activeStatus],
      })
      .skip(config.itemsCountPerPage * (page - 1))
      .take(config.itemsCountPerPage)
      .getManyAndCount();

    return {
      friends: friendship.map((e) => this.friendService.filter(e)),
      totalPages: Math.ceil(totalFriendsCount / config.itemsCountPerPage),
      totalFriendsCount,
    };
  }

  async getFriendshipTwoSite(userId: string, friendId: string): Promise<friendshipTwoSite> {
    if (!userId || !friendId) throw new Error('userId or friendId is empty');

    const friendshipUser = await Friend.findOne({
      where: {
        user: { id: userId },
        friend: { id: friendId },
      },
      relations: ['user', 'friend'],
    });

    const friendshipFriend = await Friend.findOne({
      where: {
        user: { id: friendId },
        friend: { id: userId },
      },
    });

    if ((!friendshipUser && friendshipFriend) || (friendshipUser && !friendshipFriend)) {
      throw new Error(`incomplete friendship ${friendshipUser?.id} - ${friendshipFriend?.id}`);
    }

    if (!friendshipUser && !friendshipFriend) return null;

    return { friendshipUser, friendshipFriend };
  }

  async getFriendshipTwoSiteById(id: string): Promise<friendshipTwoSite> {
    if (!id) throw new BadRequestException();

    const friendship = await Friend.findOne({
      where: { id },
      relations: ['user', 'friend'],
    });

    if (!friendship || !friendship.user || !friendship.friend) throw new NotFoundException();

    return this.getFriendshipTwoSite(friendship.user.id, friendship.friend.id);
  }

  async getFriendsIdByUserId(id: string, statusObj?: StatusObj) {
    if (!id) throw new Error('user id is empty');

    const activeStatus = Object.entries(
      statusObj ?? {
        waiting: true,
        accepted: true,
        invitation: true,
      },
    )
      .filter((e) => e[1])
      .map((e) => e[0]);

    return (
      await this.dataSource
        .createQueryBuilder()
        .select(['friend.id', 'userFriend.id'])
        .from(Friend, 'friend')
        .leftJoin('friend.friend', 'userFriend')
        .where('friend.userId=:id', { id })
        .andWhere('friend.status IN (:...status)', { status: [...activeStatus] })
        .getMany()
    ).map((e) => e.friend.id);
  }
}
