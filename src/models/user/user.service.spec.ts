import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { User } from './entities/user.entity';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TravelService } from '../travel/travel.service';
import { PostService } from '../post/post.service';

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

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
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

    service = module.get<UserService>(UserService);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('findOne should return user with given id and without sensitive data', async () => {
    const user = await service.findOne('123');
    expect(user).toEqual(userByIdFiltering('123'));
  });

  it('findOne should throw BadRequestError', async () => {
    await expect(async () => await service.findOne('')).rejects.toThrow(BadRequestException);
  });

  it('findOne should throw NotFoundException', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async () => null);

    await expect(async () => await service.findOne('1234')).rejects.toThrow(NotFoundException);
  });

  it('create should throw error (no uniqueness email and username)', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) =>
      userById(options.where.id, {
        email: options.where.email,
        username: options.where.username,
      }),
    );

    await expect(async () => await service.create(new CreateUserDto(), undefined)).rejects.toThrow(
      ConflictException,
    );
  });

  it('create should return user', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async () => null);

    const createUserDtoMock = new CreateUserDto();
    createUserDtoMock.password = 'Abcd1234';

    const user = await service.create(createUserDtoMock, undefined);
    expect(user).toBeDefined();
  });

  it('update should throw BadRequestException', async () => {
    await expect(
      async () => await service.update('', new UpdateUserDto(), undefined),
    ).rejects.toThrow(BadRequestException);
  });

  it('update should throw NotFoundException', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async () => null);

    await expect(
      async () => await service.update('123', new UpdateUserDto(), undefined),
    ).rejects.toThrow(NotFoundException);
  });

  it('update should return user without sensitive data', async () => {
    jest.spyOn(User.prototype, 'save').mockImplementation(async () => userById('123'));

    const user = await service.update('123', new UpdateUserDto(), undefined);
    expect(user).toEqual(userByIdFiltering('123'));
  });

  it('remove should throw BadRequestException', async () => {
    await expect(async () => await service.remove('')).rejects.toThrow(BadRequestException);
  });

  it('remove should throw NotFoundException', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async () => null);

    await expect(async () => await service.remove('123')).rejects.toThrow(NotFoundException);
  });

  it('remove should return user with given id and without sensitive data', async () => {
    const user = await service.remove('123');
    expect(user).toEqual(userByIdFiltering('123'));
  });

  it('getPhoto should throw BadRequestException', async () => {
    await expect(async () => await service.getPhoto('')).rejects.toThrow(BadRequestException);
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

  it('getStats should return 5 travels and 10 post count', async () => {
    const stats = await service.getStats('123');
    expect(stats).toEqual({
      travelCount: 5,
      postCount: 10,
    });
  });

  it('getStats should return 5 travels and 10 post count', async () => {
    await expect(async () => service.getStats('')).rejects.toThrow(BadRequestException);
  });
});
