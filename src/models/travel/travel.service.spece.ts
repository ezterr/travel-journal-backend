import { Test, TestingModule } from '@nestjs/testing';
import { TravelService } from './travel.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from '../user/entities/user.entity';

import { Travel } from './entities/travel.entity';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';

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

const travelById = (id: string, travelObj?: Partial<Travel>): Travel => {
  const travel = new Travel();
  travel.id = travelObj?.id ?? id;
  travel.title = travelObj?.title ?? 'USA';
  travel.destination = travelObj?.destination ?? 'USA, California';
  travel.description = travelObj?.description ?? '';
  travel.startAt = travelObj?.startAt ?? '2022-07-01';
  travel.endAt = travelObj?.endAt ?? '2022-07-04';
  travel.comradesCount = travelObj?.comradesCount ?? 1;
  travel.photoFn = travelObj?.photoFn ?? null;
  travel.user = travelObj?.user ?? ({ id: '1234' } as any);

  return travel;
};

const travelByIdFiltering = (id: string, travelObj?: Partial<Travel>) => {
  const { photoFn, user, ...travelResponse } = travelById('123', travelObj);

  return {
    ...travelResponse,
    photo: `/api/travel/photo/${travelResponse.id}`,
    authorId: user?.id,
  };
};

describe('TravelService', () => {
  let service: TravelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TravelService],
    }).compile();

    jest
      .spyOn(Travel, 'findOne')
      .mockImplementation(async (options: any) => travelById(options.where.id));

    jest
      .spyOn(User, 'findOne')
      .mockImplementation(async (options: any) => userById(options.where.id));

    jest.spyOn(Travel.prototype, 'save').mockImplementation(async () => travelById('123'));

    jest.spyOn(Travel.prototype, 'remove').mockImplementation(async () => travelById('123'));

    service = module.get<TravelService>(TravelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne should return travel with given id without sensitive data', async () => {
    const user = await service.findOne('123');
    expect(user).toEqual(travelByIdFiltering('123'));
  });

  it('findOne should throw BadRequestError', async () => {
    await expect(async () => await service.findOne('')).rejects.toThrow(BadRequestException);
  });

  it('findOne should throw NotFoundException', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async () => null);

    await expect(async () => await service.findOne('1234')).rejects.toThrow(NotFoundException);
  });

  it('findOne should join user to travel', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async (options: any) => {
      if (!options.relations.includes('user')) {
        return undefined;
      }
      return travelById('123');
    });

    const travel = await service.findOne('123');

    expect(travel).not.toBe(undefined);
  });

  it('create should throw BadRequestException if userId is empty or startAt is bigger than endAt', async () => {
    await expect(async () => service.create(new CreateTravelDto(), '', undefined)).rejects.toThrow(
      BadRequestException,
    );

    const createTravelDtoMock = new CreateTravelDto();
    createTravelDtoMock.startAt = '2022-07-09';
    createTravelDtoMock.endAt = '2022-07-03';

    await expect(async () => service.create(createTravelDtoMock, '123', undefined)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('create should throw NotFoundException if user not found', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async () => null);

    await expect(async () =>
      service.create(new CreateTravelDto(), '123', undefined),
    ).rejects.toThrow(NotFoundException);
  });

  it('create should return travel', async () => {
    const travel = await service.create(new CreateTravelDto(), '123', undefined);

    expect(travel).toBeDefined();
  });

  it('update should throw BadRequestException', async () => {
    await expect(
      async () => await service.update('', new UpdateTravelDto(), undefined),
    ).rejects.toThrow(BadRequestException);
  });

  it('update should throw NotFoundException', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async () => null);

    await expect(
      async () => await service.update('123', new UpdateTravelDto(), undefined),
    ).rejects.toThrow(NotFoundException);

    jest.spyOn(Travel, 'findOne').mockImplementation(
      async () =>
        ({
          ...travelById('123'),
          user: undefined,
        } as any),
    );

    await expect(
      async () => await service.update('123', new UpdateTravelDto(), undefined),
    ).rejects.toThrow(NotFoundException);
  });

  it('update should join user to travel', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async (options: any) => {
      if (!options.relations.includes('user')) {
        return undefined;
      }
      return travelById('123');
    });

    const travel = await service.update('123', new UpdateTravelDto(), undefined);

    expect(travel).not.toBe(undefined);
  });

  it('update should return travel', async () => {
    const travel = await service.update('123', new UpdateTravelDto(), undefined);

    expect(travel).toEqual(travelByIdFiltering('123'));
  });

  it('remove should return travel with given id and without sensitive data', async () => {
    const user = await service.remove('123');
    expect(user).toEqual(travelByIdFiltering('123'));
  });
  //
  it('remove should throw BadRequestException', async () => {
    await expect(async () => await service.remove('')).rejects.toThrow(BadRequestException);
  });

  it('remove should throw NotFoundException', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async () => null);

    await expect(async () => await service.remove('123')).rejects.toThrow(NotFoundException);
  });

  it('getPhoto should throw BadRequestException', async () => {
    await expect(async () => await service.getPhoto('')).rejects.toThrow(BadRequestException);
  });

  it('getCountByUserId if id is empty throw BadRequestException', async () => {
    await expect(async () => service.getCountByUserId('')).rejects.toThrow(BadRequestException);
  });

  it('findAllByUserId if id is empty throw BadRequestException', async () => {
    await expect(async () => service.findAllByUserId('')).rejects.toThrow(BadRequestException);
  });

  it('findAllByUserId travel must join user and order by startAt: "DESC"', async () => {
    jest.spyOn(Travel, 'find').mockImplementation(async (options: any) => {
      if (options.relations.includes('user') && options.order?.startAt === 'DESC') {
        return [
          travelById('123', {
            user: { id: options.where.user?.id } as any,
          }),
          travelById('1234', {
            user: { id: options.where.user?.id } as any,
          }),
          travelById('12345', {
            user: { id: options.where.user?.id } as any,
          }),
        ];
      }

      return [] as any;
    });

    const travels = await service.findAllByUserId('123');
    expect(travels.length).toBe(3);
  });
});
