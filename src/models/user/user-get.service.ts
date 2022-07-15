import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GetUserIndexResponse,
  GetUserResponse,
  GetUserSearchResponse,
  GetUserStatsResponse,
} from '../../types';
import { User } from './entities/user.entity';
import { FileManagementUser } from '../../common/utils/file-management/file-management-user';
import { createReadStream } from 'fs';
import { FileManagement } from '../../common/utils/file-management/file-management';
import { config } from '../../config/config';
import { Post } from '../post/entities/post.entity';
import { UserHelperService } from './user-helper.service';
import { TravelService } from '../travel/travel.service';
import { PostService } from '../post/post.service';
import { FriendService } from '../friend/friend.service';
import { DataSource } from 'typeorm';
import { FriendGetService } from '../friend/friend-get.service';
import { TravelGetService } from '../travel/travel-get.service';
import { PostGetService } from '../post/post-get.service';

@Injectable()
export class UserGetService {
  constructor(
    @Inject(forwardRef(() => FriendGetService)) private readonly friendGetService: FriendGetService,
    @Inject(forwardRef(() => UserHelperService))
    private readonly userHelperService: UserHelperService,
    @Inject(forwardRef(() => TravelService)) private readonly travelService: TravelService,
    @Inject(forwardRef(() => TravelService)) private readonly travelGetService: TravelGetService,
    @Inject(forwardRef(() => PostService)) private readonly postService: PostService,
    @Inject(forwardRef(() => PostGetService)) private postGetService: PostGetService,
    @Inject(forwardRef(() => DataSource)) private dataSource: DataSource,
  ) {}

  async getStats(id: string): Promise<GetUserStatsResponse> {
    if (!id) throw new BadRequestException();

    const travelCount = await this.travelGetService.getCountByUserId(id);
    const postCount = await this.postGetService.getCountByUserId(id);

    return {
      travelCount,
      postCount,
    };
  }

  async getPhoto(id: string) {
    if (!id) throw new BadRequestException();

    const user = await User.findOne({ where: { id } });

    if (user?.photoFn) {
      const filePath = FileManagementUser.getUserPhoto(id, user.photoFn);
      return createReadStream(filePath);
    }

    return createReadStream(FileManagement.storageDir('user.png'));
  }

  async searchUser(
    id: string | undefined,
    search: string,
    withFriends: boolean,
    page = 1,
  ): Promise<GetUserSearchResponse> {
    if (!search || search.length < 2)
      return {
        users: [],
        totalPages: 0,
        totalUsersCount: 0,
      };

    const friendsId = await this.friendGetService.getFriendsIdByUserId(id, {
      waiting: !withFriends,
      invitation: !withFriends,
      accepted: !withFriends,
    });

    const [users, totalUsersCount] = await this.dataSource
      .createQueryBuilder()
      .select(['user'])
      .from(User, 'user')
      .where('user.username LIKE :search', { search: `%${search ?? ''}%` })
      .andWhere('NOT user.id IN (:...friendsId)', {
        friendsId: [...(friendsId.length ? friendsId : ['null'])],
      })
      .andWhere('user.id <> :id', { id })
      .skip(config.itemsCountPerPage * (page - 1))
      .take(config.itemsCountPerPage)
      .getManyAndCount();

    return {
      users: users.map((e) => this.userHelperService.filterPublicData(e)),
      totalPages: Math.ceil(totalUsersCount / config.itemsCountPerPage),
      totalUsersCount,
    };
  }

  async getIndex(id: string, page = 1): Promise<GetUserIndexResponse> {
    const friendsId = await this.friendGetService.getFriendsIdByUserId(id, { accepted: true });

    const [posts, totalPostsCount] = await this.dataSource
      .createQueryBuilder()
      .select(['post', 'travel', 'user'])
      .from(Post, 'post')
      .leftJoin('post.travel', 'travel')
      .leftJoin('travel.user', 'user')
      .where('user.id IN (:...friendsId)', {
        friendsId: [...(friendsId.length ? friendsId : ['null'])],
      })
      .orWhere('user.id=:id', { id })
      .orderBy('post.createdAt', 'DESC')
      .skip(config.itemsCountPerPage * (page - 1))
      .take(config.itemsCountPerPage)
      .getManyAndCount();

    const postsFiltered = posts.map((post) => {
      const { travel } = post;
      const { user } = travel;

      return {
        ...this.postService.filter(post),
        travel: { ...this.travelService.filter(travel) },
        user: { ...this.userHelperService.filterPublicData(user) },
      };
    });

    return {
      posts: postsFiltered,
      totalPages: Math.ceil(totalPostsCount / config.itemsCountPerPage),
      totalPostsCount,
    };
  }

  async findOne(id: string): Promise<GetUserResponse> {
    if (!id) throw new BadRequestException();

    const user = await User.findOne({ where: { id } });
    if (!user) throw new NotFoundException();

    return this.userHelperService.filter(user);
  }
}
