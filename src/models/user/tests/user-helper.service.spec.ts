import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { User } from '../entities/user.entity';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { TravelService } from '../../travel/travel.service';
import { PostService } from '../../post/post.service';
import { UserHelperService } from '../user-helper.service';

const moduleMocker = new ModuleMocker(global);

const userById = (id: string, userObj?: Partial<User>): User => {
  const user = new User();
  user.id = userObj?.id ?? id;
  user.firstName = userObj?.firstName ?? 'Jan';
  user.lastName = userObj?.lastName ?? 'Kowalski';
  user.username = userObj?.username ?? 'janko';
  user.email = userObj?.email ?? 'jan@xyz.pl';
  user.bio = userObj?.bio ?? '';
  user.photoFn = userObj?.id ?? null;

  return user;
};

const userByIdFiltering = (id: string, userObj?: Partial<User>) => {
  const { jwtId, hashPwd, photoFn, ...userResponse } = userById(id, userObj);

  return { ...userResponse, avatar: `/api/user/photo/${userResponse.id}` };
};

describe('UserHelperService', () => {
  let service: UserHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserHelperService],
    })
      .useMocker((token) => {
        if (token === TravelService) {
          return { getCountByUserId: jest.fn().mockResolvedValue(5) };
        }

        if (token === PostService) {
          return { getCountByUserId: jest.fn().mockResolvedValue(10) };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    jest
      .spyOn(User, 'findOne')
      .mockImplementation(async (options: any) => userById(options.where.id));

    jest.spyOn(User.prototype, 'save').mockImplementation(async () => userById('123'));

    jest.spyOn(User.prototype, 'remove').mockImplementation(async () => userById('123'));

    service = module.get<UserHelperService>(UserHelperService);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('checkUserFieldUniquenessAndThrow should throw Error', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) =>
      userById(options.where.id, {
        email: options.where.email,
        username: options.where.username,
      }),
    );

    await expect(
      async () =>
        await service.checkUserFieldUniquenessAndThrow({
          email: 'email@xyz.abc',
        }),
    ).rejects.toThrow(ConflictException);
  });

  it('checkUserFieldUniqueness should throw Error', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) =>
      userById(options.where.id, {
        email: options.where.email,
        username: options.where.username,
      }),
    );

    expect(await service.checkUserFieldUniqueness({ email: 'example@xyz.ab' })).toBe(false);
  });

  it('checkUserFieldUniqueness should throw Error', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async () => null);

    expect(await service.checkUserFieldUniqueness({ email: 'example@xyz.ab' })).toBe(true);
  });
});
