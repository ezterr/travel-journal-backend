import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from '../../models/user/entities/user.entity';

@Injectable()
export class AccountOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const ownerId = request.params?.id;

    if (!ownerId) throw new BadRequestException();
    if (!user) throw new Error('User is undefined');

    return user.id === ownerId;
  }
}
