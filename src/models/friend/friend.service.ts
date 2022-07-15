import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFriendDto } from './dto/create-friend.dto';
import {
  CreateFriendResponse,
  DeleteFriendResponse,
  FriendSaveResponseData,
  FriendStatus,
  GetFriendsResponse,
  UpdateFriendResponse,
} from '../../types';
import { Friend } from './entities/friend.entity';
import { User } from '../user/entities/user.entity';
import { DataSource } from 'typeorm';
import { UserService } from '../user/user.service';
import { config } from '../../config/config';

interface StatusObj {
  waiting?: boolean;
  accepted?: boolean;
  invitation?: boolean;
}

type friendshipTwoSite = { friendshipUser: Friend; friendshipFriend: Friend };

@Injectable()
export class FriendService {
  constructor(
    @Inject(forwardRef(() => DataSource)) private readonly dataSource: DataSource,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
  ) {}

  async create(userId: string, { friendId }: CreateFriendDto): Promise<CreateFriendResponse> {
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
      .where('`friendship`.`userId`=:id', { id })
      .andWhere('`friendship`.`status` IN (:...status)', {
        status: [...activeStatus],
      })
      .skip(config.itemsCountPerPage * (page - 1))
      .take(config.itemsCountPerPage)
      .getManyAndCount();

    return {
      friends: friendship.map((e) => this.filter(e)),
      totalPages: Math.ceil(totalFriendsCount / config.itemsCountPerPage),
      totalFriendsCount,
    };
  }

  async update(id: string): Promise<UpdateFriendResponse> {
    if (!id) throw new BadRequestException();

    const { friendshipUser, friendshipFriend } = await this.getFriendshipTwoSiteById(id);

    if (!friendshipUser || !friendshipFriend) throw new NotFoundException();
    if (friendshipUser.status !== FriendStatus.Invitation) throw new ForbiddenException();

    friendshipUser.status = FriendStatus.Accepted;
    friendshipFriend.status = FriendStatus.Accepted;

    await friendshipUser.save();
    await friendshipFriend.save();

    return this.filter(friendshipUser);
  }

  async remove(id: string): Promise<DeleteFriendResponse> {
    if (!id) throw new BadRequestException();

    const { friendshipUser, friendshipFriend } = await this.getFriendshipTwoSiteById(id);

    if (friendshipUser) await friendshipUser.remove();
    if (friendshipFriend) await friendshipFriend.remove();

    return this.filter(friendshipUser);
  }

  async checkFriendshipExist(userId: string, friendId: string): Promise<boolean> {
    return !!(await this.getFriendshipTwoSite(userId, friendId));
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

  filter(friendship: Friend): FriendSaveResponseData {
    const { user, friend, ...friendshipResponse } = friendship;

    return {
      ...friendshipResponse,
      userId: user.id,
      friend: this.userService.filterPublicData(friend),
    };
  }
}
