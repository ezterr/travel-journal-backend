import {
  BadRequestException,
  ConflictException,
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
  UserPublicDataInterface,
} from '../../types';
import { createHashPwd } from '../../common/utils/create-hash-pwd';
import { UserSaveResponseData } from '../../types';
import { Express } from 'express';
import { FileManagementUser } from '../../common/utils/file-management/file-management-user';
import { createReadStream } from 'fs';
import { FileManagement } from '../../common/utils/file-management/file-management';
import { PostService } from '../post/post.service';
import { TravelService } from '../travel/travel.service';
import { DataSource } from 'typeorm';
import { FriendService } from '../friend/friend.service';
import { Post } from '../post/entities/post.entity';
import { config } from '../../config/config';

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => TravelService)) private readonly travelService: TravelService,
    @Inject(forwardRef(() => PostService)) private readonly postService: PostService,
    @Inject(forwardRef(() => FriendService)) private readonly friendService: FriendService,
    @Inject(forwardRef(() => DataSource)) private dataSource: DataSource,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    file: Express.Multer.File,
  ): Promise<CreateUserResponse> {
    try {
      await this.checkUserFieldUniquenessAndThrow({
        email: createUserDto.email,
      });
      await this.checkUserFieldUniquenessAndThrow({
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

      return this.filter(user);
    } catch (e) {
      if (file) await FileManagementUser.removeFromTmp(file.filename);
      throw e;
    }
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
      users: users.map((e) => this.filterPublicData(e)),
      totalPages: Math.ceil(totalUsersCount / config.itemsCountPerPage),
      totalUsersCount,
    };
  }

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
        user: { ...this.filterPublicData(user) },
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

    return this.filter(user);
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

      return this.filter(user);
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

    return this.filter(user);
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

  async getPhoto(id: string) {
    if (!id) throw new BadRequestException();

    const user = await User.findOne({ where: { id } });

    if (user?.photoFn) {
      const filePath = FileManagementUser.getUserPhoto(id, user.photoFn);
      return createReadStream(filePath);
    }

    return createReadStream(FileManagement.storageDir('user.png'));
  }

  async checkUserFieldUniquenessAndThrow(value: { [key: string]: any }): Promise<void> {
    const user = await User.findOne({
      where: value,
    });

    const [key] = Object.keys(value);
    if (user) throw new ConflictException(`${key} is not unique`);
  }

  async checkUserFieldUniqueness(value: { [key: string]: any }): Promise<boolean> {
    const user = await User.findOne({
      where: value,
    });

    return !user;
  }

  filter(userEntity: User): UserSaveResponseData {
    const { jwtId, hashPwd, photoFn, travels, friends, friendsRevert, ...userResponse } =
      userEntity;

    return { ...userResponse, avatar: `/api/user/photo/${userResponse.id}` };
  }

  filterPublicData(userEntity: User): UserPublicDataInterface {
    const {
      jwtId,
      hashPwd,
      photoFn,
      email,
      bio,
      travels,
      friends,
      friendsRevert,
      ...userResponse
    } = userEntity;

    return { ...userResponse, avatar: `/api/user/photo/${userResponse.id}` };
  }
}
