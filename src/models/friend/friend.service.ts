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
  UpdateFriendResponse,
} from '../../types';
import { Friend } from './entities/friend.entity';
import { User } from '../user/entities/user.entity';
import { UserHelperService } from '../user/user-helper.service';
import { FriendGetService } from './friend-get.service';

@Injectable()
export class FriendService {
  constructor(
    @Inject(forwardRef(() => FriendGetService)) private readonly friendGetService: FriendGetService,
    @Inject(forwardRef(() => UserHelperService))
    private readonly userHelperService: UserHelperService,
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

  async update(id: string): Promise<UpdateFriendResponse> {
    if (!id) throw new BadRequestException();

    const { friendshipUser, friendshipFriend } =
      await this.friendGetService.getFriendshipTwoSiteById(id);

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

    const { friendshipUser, friendshipFriend } =
      await this.friendGetService.getFriendshipTwoSiteById(id);

    if (friendshipUser) await friendshipUser.remove();
    if (friendshipFriend) await friendshipFriend.remove();

    return this.filter(friendshipUser);
  }

  async checkFriendshipExist(userId: string, friendId: string): Promise<boolean> {
    return !!(await this.friendGetService.getFriendshipTwoSite(userId, friendId));
  }

  filter(friendship: Friend): FriendSaveResponseData {
    const { user, friend, ...friendshipResponse } = friendship;

    return {
      ...friendshipResponse,
      userId: user.id,
      friend: this.userHelperService.filterPublicData(friend),
    };
  }
}
