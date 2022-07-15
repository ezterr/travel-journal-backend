import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { User } from '../entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserGetService } from '../user-get.service';
import { PostGetService } from '../../post/post-get.service';
import { UserHelperService } from '../user-helper.service';
import { TravelService } from '../../travel/travel.service';

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

describe('UserGetService', () => {
  let service: UserGetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserGetService],
    })
      .useMocker((token) => {
        if (token === TravelService) {
          return { getCountByUserId: jest.fn().mockResolvedValue(5) };
        }

        if (token === UserHelperService) {
          return { filter: jest.fn().mockResolvedValue(userByIdFiltering('123')) };
        }

        if (token === PostGetService) {
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

    service = module.get<UserGetService>(UserGetService);
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

  it('getPhoto should throw BadRequestException', async () => {
    await expect(async () => await service.getPhoto('')).rejects.toThrow(BadRequestException);
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
