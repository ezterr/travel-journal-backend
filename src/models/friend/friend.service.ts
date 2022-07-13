import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';
import {
  CreateFriendResponse,
  FriendSaveResponseData,
  FriendStatus,
} from '../../types';
import { Friend } from './entities/friend.entity';
import { User } from '../user/entities/user.entity';
import { DataSource } from 'typeorm';

interface statusObj {
  waiting?: boolean;
  accepted?: boolean;
  invitation?: boolean;
}

@Injectable()
export class FriendService {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    userId: string,
    { friendId }: CreateFriendDto,
  ): Promise<CreateFriendResponse> {
    const friendshipExist = await this.checkFriendshipExist(userId, friendId);
    if (friendshipExist) throw new ConflictException();

    const user = await User.findOne({ where: { id: userId } });
    const friend = await User.findOne({ where: { id: friendId } });
    if (!user || !friend) throw new NotFoundException();

    const friendship = new Friend();
    friendship.user = user;
    friendship.friend = friend;
    friendship.status = FriendStatus.Waiting;
    await friendship.save();

    const friendshipRevert = new Friend();
    friendshipRevert.user = friend;
    friendshipRevert.friend = user;
    friendshipRevert.status = FriendStatus.Invitation;
    await friendshipRevert.save();

    return this.filter(friendship);
  }

  async findAllByUserId(id: string, statusObj: statusObj) {
    if (!id) throw new BadRequestException();

    const activeStatus = Object.entries(statusObj)
      .filter((e) => e[1])
      .map((e) => e[0]);

    let friendship: Friend[] = [];
    if (activeStatus.length > 0) {
      friendship = await this.dataSource
        .createQueryBuilder()
        .select(['friendship', 'friend.id', 'user.id'])
        .from(Friend, 'friendship')
        .leftJoin('friendship.user', 'user')
        .leftJoin('friendship.friend', 'friend')
        .where('`friendship`.`userId`=:id', { id })
        .andWhere('`friendship`.`status` IN (:...status)', {
          status: [...activeStatus],
        })
        .getMany();
    } else {
      friendship = await Friend.find({
        where: { user: { id } },
        relations: ['user', 'friend'],
      });
    }

    return friendship.map((e) => this.filter(e));
  }

  findOne(id: number) {
    return `This action returns a #${id} friend`;
  }

  update(id: number, updateFriendDto: UpdateFriendDto) {
    return `This action updates a #${id} friend`;
  }

  remove(id: number) {
    return `This action removes a #${id} friend`;
  }

  async checkFriendshipExist(userId: string, friendId: string) {
    return !!(await this.getFriendshipTwoSite(userId, friendId));
  }

  async getFriendshipTwoSite(userId: string, friendId: string) {
    if (!userId || !friendId) throw new Error('userId or friendId is empty');

    const friendship = await Friend.findOne({
      where: {
        user: { id: userId },
        friend: { id: friendId },
      },
    });

    const friendshipRevert = await Friend.findOne({
      where: {
        user: { id: friendId },
        friend: { id: userId },
      },
    });

    if (
      (!friendship && friendshipRevert) ||
      (friendship && !friendshipRevert)
    ) {
      throw new Error(
        `incomplete friendship ${friendship?.id} - ${friendshipRevert?.id}`,
      );
    }

    if (!friendship && !friendshipRevert) return null;

    return { friendship, friendshipRevert };
  }

  filter(friendship: Friend): FriendSaveResponseData {
    const { user, friend, ...friendshipResponse } = friendship;

    return {
      ...friendshipResponse,
      userId: user.id,
      friendId: friend.id,
    };
  }
}
