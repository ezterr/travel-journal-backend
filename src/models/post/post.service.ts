import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreatePostDto } from './dto/create-post.dto';
import {
  CreatePostResponse,
  GetPostResponse,
  GetPostsResponse,
  PostSaveResponseData,
} from '../../types';
import { Travel } from '../travel/entities/travel.entity';
import { Post } from './entities/post.entity';
import { FileManagementPost } from '../../common/utils/file-management-post';
import { createReadStream, ReadStream } from 'fs';
import { FileManagement } from '../../common/utils/file-management';
import { DataSource } from 'typeorm';

@Injectable()
export class PostService {
  constructor(@Inject(DataSource) private dataSource: DataSource) {}

  async create(
    travelId: string,
    createPostDto: CreatePostDto,
    file: Express.Multer.File,
  ): Promise<CreatePostResponse> {
    try {
      if (!travelId) throw new BadRequestException();

      const travel = await Travel.findOne({
        where: { id: travelId },
        relations: ['user'],
      });
      if (!travel || !travel.user) throw new NotFoundException();

      const post = new Post();
      post.title = createPostDto.title;
      post.destination = createPostDto.destination;
      post.description = createPostDto.description;
      post.createdAt = new Date().toISOString();

      await post.save();

      post.travel = travel;

      if (file) {
        if (post.photoFn) {
          await FileManagementPost.removePostPhoto(
            travel.user.id,
            travel.id,
            post.photoFn,
          );
        }
        const newFile = await FileManagementPost.savePostPhoto(
          travel.user.id,
          travel.id,
          file,
        );
        await FileManagementPost.removeFromTmp(file.filename);

        post.photoFn = newFile.filename;
      }

      await post.save();

      return this.filter(post);
    } catch (e) {
      if (file) await FileManagementPost.removeFromTmp(file.filename);
      throw e;
    }
  }

  async findOne(id: string): Promise<GetPostResponse> {
    if (!id) throw new BadRequestException();

    const post = await this.findOneById(id);
    if (!post) throw new NotFoundException();

    return this.filter(post);
  }

  async findAllByTravelId(id: string): Promise<GetPostsResponse> {
    if (!id) throw new Error('id is empty');

    const posts = await this.dataSource
      .createQueryBuilder()
      .select(['post', 'travel.id', 'user.id'])
      .from(Post, 'post')
      .leftJoin('post.travel', 'travel')
      .leftJoin('travel.user', 'user')
      .where('`travel`.`id`=:id', { id })
      .orderBy('`post`.`createdAt`', 'DESC')
      .getMany();

    return posts.map((e) => this.filter(e));
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    file: Express.Multer.File,
  ) {
    try {
      if (!id) throw new BadRequestException();

      const post = await this.findOneById(id);
      if (!post || !post.travel || !post.travel.user)
        throw new NotFoundException();

      post.title = updatePostDto.title ?? post.title;
      post.destination = updatePostDto.destination ?? post.destination;
      post.description = updatePostDto.description ?? post.description;

      await post.save();

      if (file) {
        if (post.photoFn) {
          await FileManagementPost.removePostPhoto(
            post.travel.user.id,
            post.travel.id,
            post.photoFn,
          );
        }

        const newFile = await FileManagementPost.savePostPhoto(
          post.travel.user.id,
          post.travel.id,
          file,
        );
        await FileManagementPost.removeFromTmp(file.filename);
        post.photoFn = newFile.filename;
      }

      await post.save();

      return this.filter(post);
    } catch (e) {
      if (file) await FileManagementPost.removeFromTmp(file.filename);
      throw e;
    }
  }

  async remove(id: string) {
    if (!id) throw new BadRequestException();

    const post = await this.findOneById(id);
    if (!post || !post.travel || !post.travel.user)
      throw new NotFoundException();

    if (post.photoFn)
      await FileManagementPost.removePostPhoto(
        post.travel.user.id,
        post.travel.id,
        post.photoFn,
      );
    await post.remove();

    return this.filter(post);
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
      .where('`post`.`id`=:id', { id })
      .getOne();
  }

  async getCountByUserId(id: string): Promise<number> {
    if (!id) throw new BadRequestException();

    return Post.count({
      where: { travel: { user: { id } } },
    });
  }

  filter(post: Post): PostSaveResponseData {
    const { photoFn, travel, ...postResponse } = post;

    return {
      ...postResponse,
      photo: `/api/post/photo/${postResponse.id}`,
      authorId: travel.user.id,
      travelId: travel.id,
    };
  }
}
