import { BadRequestException, Injectable } from '@nestjs/common';
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

@Injectable()
export class PostService {
  async create(
    travelId: string,
    user: User,
    createPostDto: CreatePostDto,
    file: Express.Multer.File,
  ): Promise<CreatePostResponse> {
    try {
      if (!travelId) throw new BadRequestException();

      const travel = await Travel.findOne({
        where: { id: travelId },
        relations: ['user'],
      });

      if (!travel || !user) throw new BadRequestException();

      const post = new Post();
      post.title = createPostDto.title;
      post.destination = createPostDto.destination;
      post.description = createPostDto.description;
      post.createdAt = new Date().toISOString();

      await post.save();

      post.travel = travel;

      if (file) {
        await FileManagementPost.removePostPhoto(
          user.id,
          travel.id,
          file.filename,
        );
        await FileManagementPost.savePostPhoto(user.id, travel.id, file);
        post.photoFn = file.filename;
      }

      await post.save();

      return this.filter(post);
    } catch (e) {
      await FileManagementPost.removeFromTmp(file.filename);
      throw e;
    }
  }

  findOne(id: string) {
    return `This action returns a #${id} post`;
  }

  async findAllByTravelId(id: string): Promise<GetPostsResponse> {
    if (!id) throw new BadRequestException();

    const posts = await Post.find({
      where: { travel: { id } },
    });

    return posts.map((e) => this.filter(e));
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }

  filter(post: Post): PostSaveResponseData {
    const { photoFn, travel, ...postResponse } = post;

    return {
      ...postResponse,
      photo: `/api/travel/photo/${postResponse.id}`,
    };
  }
}
