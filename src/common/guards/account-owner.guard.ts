import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from '../../models/user/entities/user.entity';

@Injectable()
export class AccountOwnerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const target = context.getHandler();
    const ownerIdParamKey = this.reflector.get('ownerParamKey', target) || 'id';
    const request: Request = context.switchToHttp().getRequest();
    const userId = (request.user as User).id;
    const ownerId = request.params?.[ownerIdParamKey];

    if (!userId || !ownerId) throw new Error('UserId or ownerId is undefined');

    return userId === ownerId;
  }
}
