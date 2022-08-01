import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { compare } from 'bcrypt';
import {
  CreateUserResponse,
  DeleteUserResponse,
  GetUserIndexResponse,
  GetUserResponse,
  GetUserSearchResponse,
  GetUserStatsResponse,
  UpdateUserResponse,
} from '../types';
import { createHashPwd } from '../common/utils/create-hash-pwd';
import { Express } from 'express';
import { FileManagementUser } from '../common/utils/file-management/file-management-user';
import { UserHelperService } from './user-helper.service';
import { TravelService } from '../travel/travel.service';
import { PostService } from '../post/post.service';
import { DataSource } from 'typeorm';
import { Post } from '../post/entities/post.entity';
import { config } from '../config/config';
import { createReadStream } from 'fs';
import { FileManagement } from '../common/utils/file-management/file-management';
import { FriendService } from '../friend/friend.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => FriendService)) private friendService: FriendService,
    @Inject(forwardRef(() => UserHelperService)) private userHelperService: UserHelperService,
    @Inject(forwardRef(() => TravelService)) private travelService: TravelService,
    @Inject(forwardRef(() => PostService)) private postService: PostService,
    @Inject(forwardRef(() => DataSource)) private dataSource: DataSource,
  ) {}

  async getIndex(id: string, page = 1): Promise<GetUserIndexResponse> {
    const friendsId = await this.friendService.getFriendsIdByUserId(id, { accepted: true });

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

  async create(
    createUserDto: CreateUserDto,
    file: Express.Multer.File,
  ): Promise<CreateUserResponse> {
    try {
      await this.userHelperService.checkUserFieldUniquenessAndThrow({
        email: createUserDto.email,
      });
      await this.userHelperService.checkUserFieldUniquenessAndThrow({
        username: createUserDto.username,
      });

      const user = new User();
      user.firstName = createUserDto.firstName;
      user.lastName = createUserDto.lastName;
      user.username = createUserDto.username;
      user.email = createUserDto.email;
      user.hashPwd = await createHashPwd(createUserDto.password);

      await user.save();

      if (file) {
        if (user.photoFn) {
          await FileManagementUser.removeUserPhoto(user.id, user.photoFn);
        }

        const newFile = await FileManagementUser.saveUserPhoto(user.id, file);
        await FileManagementUser.removeFromTmp(file.filename);

        user.photoFn = newFile.filename;
      }

      await user.save();

      return this.userHelperService.filter(user);
    } catch (e) {
      if (file) await FileManagementUser.removeFromTmp(file.filename);
      throw e;
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    file: Express.Multer.File,
  ): Promise<UpdateUserResponse> {
    try {
      if (!id) throw new BadRequestException();

      const user = await User.findOne({ where: { id } });
      if (!user) throw new NotFoundException();

      user.firstName = updateUserDto.firstName ?? user.firstName;
      user.lastName = updateUserDto.lastName ?? user.lastName;
      user.bio = updateUserDto.bio ?? user.bio;

      if (updateUserDto.newPassword) {
        if (updateUserDto.password) {
          const hashCompareResult = await compare(updateUserDto.password, user.hashPwd);

          if (hashCompareResult) {
            user.hashPwd = await createHashPwd(updateUserDto.newPassword);
          } else throw new UnauthorizedException();
        } else throw new UnauthorizedException();
      }

      if (file) {
        if (user.photoFn) {
          await FileManagementUser.removeUserPhoto(user.id, user.photoFn);
        }

        const newFile = await FileManagementUser.saveUserPhoto(user.id, file);
        await FileManagementUser.removeFromTmp(file.filename);

        user.photoFn = newFile.filename;
      }

      await user.save();

      return this.userHelperService.filter(user);
    } catch (e) {
      if (file) await FileManagementUser.removeFromTmp(file.filename);
      throw e;
    }
  }

  async remove(id: string): Promise<DeleteUserResponse> {
    if (!id) throw new BadRequestException();

    const user = await User.findOne({ where: { id } });
    if (!user) throw new NotFoundException();

    await FileManagementUser.removeUserDir(id);
    await user.remove();

    return this.userHelperService.filter(user);
  }

  async getStats(id: string): Promise<GetUserStatsResponse> {
    if (!id) throw new BadRequestException();

    const travelCount = await this.travelService.getCountByUserId(id);
    const postCount = await this.postService.getCountByUserId(id);

    return {
      travelCount,
      postCount,
    };
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

    const friendsId = await this.friendService.getFriendsIdByUserId(id, {
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

  async getPhoto(id: string) {
    if (!id) throw new BadRequestException();

    const user = await User.findOne({ where: { id } });

    if (user?.photoFn) {
      const filePath = FileManagementUser.getUserPhoto(id, user.photoFn);
      return createReadStream(filePath);
    }

    return createReadStream(FileManagement.storageDir('user.png'));
  }
}
