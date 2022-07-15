import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreatePostResponse, DeletePostResponse, PostSaveResponseData } from '../../types';
import { Travel } from '../travel/entities/travel.entity';
import { Post } from './entities/post.entity';
import { FileManagementPost } from '../../common/utils/file-management/file-management-post';
import { DataSource } from 'typeorm';
import { PostGetService } from './post-get.service';

@Injectable()
export class PostService {
  constructor(
    @Inject(forwardRef(() => DataSource)) private dataSource: DataSource,
    @Inject(forwardRef(() => PostGetService)) private postGetService: PostGetService,
  ) {}

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
      post.createdAt = new Date();

      await post.save();

      post.travel = travel;

      if (file) {
        if (post.photoFn) {
          await FileManagementPost.removePostPhoto(travel.user.id, travel.id, post.photoFn);
        }
        const newFile = await FileManagementPost.savePostPhoto(travel.user.id, travel.id, file);
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

  async update(id: string, updatePostDto: UpdatePostDto, file: Express.Multer.File) {
    try {
      if (!id) throw new BadRequestException();

      const post = await this.postGetService.findOneById(id);
      if (!post || !post.travel || !post.travel.user) throw new NotFoundException();

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

  async remove(id: string): Promise<DeletePostResponse> {
    if (!id) throw new BadRequestException();

    const post = await this.postGetService.findOneById(id);
    if (!post || !post.travel || !post.travel.user) throw new NotFoundException();

    if (post.photoFn)
      await FileManagementPost.removePostPhoto(post.travel.user.id, post.travel.id, post.photoFn);
    await post.remove();

    return this.filter(post);
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
