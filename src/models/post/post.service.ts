import {
  BadRequestException,
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
import { User } from '../user/entities/user.entity';
import { DataSource } from 'typeorm';
import { createReadStream, ReadStream } from 'fs';

@Injectable()
export class PostService {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    travelId: string,
    user: User,
    createPostDto: CreatePostDto,
    file: Express.Multer.File,
  ): Promise<CreatePostResponse> {
    try {
      if (!travelId) throw new BadRequestException();

      const travel = await Travel.findOne({ where: { id: travelId } });
      if (!travel || !user) throw new BadRequestException();

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
            user.id,
            travel.id,
            post.photoFn,
          );
        }
        await FileManagementPost.savePostPhoto(user.id, travel.id, file);
        post.photoFn = file.filename;
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

    const post = await Post.findOne({ where: { id } });
    if (!post) throw new NotFoundException();

    return this.filter(post);
  }

  async findAllByTravelId(id: string): Promise<GetPostsResponse> {
    if (!id) throw new BadRequestException();

    const posts = await Post.find({
      where: { travel: { id } },
    });

    return posts.map((e) => this.filter(e));
  }

  async update(
    id: string,
    user: User,
    updatePostDto: UpdatePostDto,
    file: Express.Multer.File,
  ) {
    try {
      if (!id) throw new BadRequestException();

      const post = await Post.findOne({
        where: { id },
        relations: ['travel'],
      });
      if (!post || !post.travel) throw new BadRequestException();

      post.title = updatePostDto.title ?? post.title;
      post.destination = updatePostDto.destination ?? post.destination;
      post.description = updatePostDto.description ?? post.description;

      await post.save();

      if (file) {
        if (post.photoFn) {
          await FileManagementPost.removePostPhoto(
            user.id,
            post.travel.id,
            post.photoFn,
          );
        }
        await FileManagementPost.savePostPhoto(user.id, post.travel.id, file);
        post.photoFn = file.filename;
      }

      await post.save();

      return this.filter(post);
    } catch (e) {
      console.log(file);
      if (file) await FileManagementPost.removeFromTmp(file.filename);
      throw e;
    }
  }

  async remove(id: string, user: User) {
    if (!id) throw new BadRequestException();

    const post = await Post.findOne({
      where: { id },
      relations: ['travel'],
    });
    if (!post || !post?.travel.id) throw new NotFoundException();

    await FileManagementPost.removePostPhoto(
      user.id,
      post.travel.id,
      post.photoFn,
    );
    await post.remove();

    return this.filter(post);
  }

  async getPhoto(id: string, user: User): Promise<ReadStream> {
    if (!id || !user) throw new BadRequestException();

    const post = await Post.findOne({
      where: { id },
      relations: ['travel'],
    });

    if (post?.photoFn && post?.travel.id) {
      const filePath = FileManagementPost.getPostPhoto(
        user.id,
        post.travel.id,
        post.photoFn,
      );
      return createReadStream(filePath);
    }

    throw new NotFoundException();
  }

  filter(post: Post): PostSaveResponseData {
    const { photoFn, travel, ...postResponse } = post;

    return {
      ...postResponse,
      photo: `/api/post/photo/${postResponse.id}`,
    };
  }
}
