import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetPostResponse, GetPostsResponse } from '../../types';
import { Post } from './entities/post.entity';
import { config } from '../../config/config';
import { createReadStream, ReadStream } from 'fs';
import { FileManagementPost } from '../../common/utils/file-management/file-management-post';
import { FileManagement } from '../../common/utils/file-management/file-management';
import { DataSource } from 'typeorm';
import { PostService } from './post.service';

@Injectable()
export class PostGetService {
  constructor(
    @Inject(forwardRef(() => DataSource)) private dataSource: DataSource,
    @Inject(forwardRef(() => PostService)) private postService: PostService,
  ) {}

  async findOne(id: string): Promise<GetPostResponse> {
    if (!id) throw new BadRequestException();

    const post = await this.findOneById(id);
    if (!post) throw new NotFoundException();

    return this.postService.filter(post);
  }

  async findAllByTravelId(id: string, page = 1): Promise<GetPostsResponse> {
    if (!id) throw new Error('id is empty');

    const [posts, totalPostsCount] = await this.dataSource
      .createQueryBuilder()
      .select(['post', 'travel.id', 'user.id'])
      .from(Post, 'post')
      .leftJoin('post.travel', 'travel')
      .leftJoin('travel.user', 'user')
      .where('travel.id=:id', { id })
      .orderBy('post.createdAt', 'DESC')
      .skip(config.itemsCountPerPage * (page - 1))
      .take(config.itemsCountPerPage)
      .getManyAndCount();

    return {
      posts: posts.map((e) => this.postService.filter(e)),
      totalPages: Math.ceil(totalPostsCount / config.itemsCountPerPage),
      totalPostsCount,
    };
  }

  async getPhoto(id: string): Promise<ReadStream> {
    if (!id) throw new BadRequestException();

    const post = await this.findOneById(id);
    if (post.photoFn && post.travel && post.travel.user) {
      const filePath = FileManagementPost.getPostPhoto(
        post.travel.user.id,
        post.travel.id,
        post.photoFn,
      );
      return createReadStream(filePath);
    }

    return createReadStream(FileManagement.storageDir('no-image.png'));
  }

  async findOneById(id: string) {
    if (!id) throw new Error('postId is empty');

    return this.dataSource
      .createQueryBuilder()
      .select(['post', 'travel.id', 'user.id'])
      .from(Post, 'post')
      .leftJoin('post.travel', 'travel')
      .leftJoin('travel.user', 'user')
      .where('post.id=:id', { id })
      .getOne();
  }

  async getCountByUserId(id: string): Promise<number> {
    if (!id) throw new BadRequestException();

    return Post.count({
      where: { travel: { user: { id } } },
    });
  }
}
