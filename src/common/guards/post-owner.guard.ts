import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../models/user/entities/user.entity';
import { DataSource } from 'typeorm';
import { Post } from '../../models/post/entities/post.entity';

export class PostOwnerGuard implements CanActivate {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const postId = request.params?.id;

    if (!postId) throw new BadRequestException();
    if (!user) throw new Error('user is undefined');

    const postSimple = await this.dataSource
      .createQueryBuilder()
      .select(['post.id', 'travel.id', 'user.id'])
      .from(Post, 'post')
      .leftJoin('post.travel', 'travel')
      .leftJoin('travel.user', 'user')
      .where('`post`.`id`=:postId', { postId })
      .getOne();

    if (!postSimple) throw new NotFoundException();

    return postSimple.travel.user.id === user.id;
  }
}
