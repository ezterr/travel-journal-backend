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
import { createReadStream, ReadStream } from 'fs';
import { FileManagement } from '../../common/utils/file-management';

@Injectable()
export class PostService {
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
      if (!travel || !travel.user) throw new BadRequestException();

      const post = new Post();
      post.title = createPostDto.title;
      post.destination = createPostDto.destination;
      post.description = createPostDto.description;
      post.createdAt = new Date().toISOString();

      await post.save();

      post.travel = travel;
      post.user = travel.user;

      if (file) {
        if (post.photoFn) {
          await FileManagementPost.removePostPhoto(
            travel.user.id,
            travel.id,
            post.photoFn,
          );
        }
        await FileManagementPost.savePostPhoto(travel.user.id, travel.id, file);
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

    const post = await Post.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!post) throw new NotFoundException();

    return this.filter(post);
  }

  async findAllByTravelId(id: string): Promise<GetPostsResponse> {
    if (!id) throw new BadRequestException();

    const posts = await Post.find({
      where: { travel: { id } },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    return posts.map((e) => this.filter(e));
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    file: Express.Multer.File,
  ) {
    try {
      if (!id) throw new BadRequestException();

      const post = await Post.findOne({
        where: { id },
        relations: ['travel', 'user'],
      });
      if (!post || !post.travel || !post.user) throw new BadRequestException();

      post.title = updatePostDto.title ?? post.title;
      post.destination = updatePostDto.destination ?? post.destination;
      post.description = updatePostDto.description ?? post.description;

      await post.save();

      if (file) {
        if (post.photoFn) {
          await FileManagementPost.removePostPhoto(
            post.user.id,
            post.travel.id,
            post.photoFn,
          );
        }

        await FileManagementPost.savePostPhoto(
          post.user.id,
          post.travel.id,
          file,
        );
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

  async remove(id: string) {
    if (!id) throw new BadRequestException();

    const post = await Post.findOne({
      where: { id },
      relations: ['travel', 'user'],
    });

    if (!post || !post.travel || !post.user) throw new NotFoundException();

    if (post.photoFn)
      await FileManagementPost.removePostPhoto(
        post.user.id,
        post.travel.id,
        post.photoFn,
      );
    await post.remove();

    return this.filter(post);
  }

  async getPhoto(id: string): Promise<ReadStream> {
    if (!id) throw new BadRequestException();

    const post = await Post.findOne({
      where: { id },
      relations: ['travel', 'user'],
    });

    if (post?.photoFn && post.travel && post.user) {
      const filePath = FileManagementPost.getPostPhoto(
        post.user.id,
        post.travel.id,
        post.photoFn,
      );
      return createReadStream(filePath);
    }

    return createReadStream(FileManagement.storageDir('no-image.png'));
  }

  filter(post: Post): PostSaveResponseData {
    const { photoFn, travel, user, ...postResponse } = post;

    return {
      ...postResponse,
      photo: `/api/post/photo/${postResponse.id}`,
      authorId: user.id,
    };
  }
}
