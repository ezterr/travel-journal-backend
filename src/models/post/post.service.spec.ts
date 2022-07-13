import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Travel } from '../travel/entities/travel.entity';
import { UpdateTravelDto } from '../travel/dto/update-travel.dto';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

const moduleMocker = new ModuleMocker(global);

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

const postById = (id: string, postObj?: Partial<Post>): Post => {
  const post = new Post();
  post.id = postObj?.id ?? id;
  post.title = postObj?.title ?? 'Wow';
  post.destination = postObj?.destination ?? 'USA, California';
  post.description = postObj?.description ?? '';
  post.createdAt = postObj?.createdAt ?? 'jan@xyz.pl';
  post.photoFn = postObj?.id ?? null;
  post.travel = postObj?.travel ?? ({ id: '123', user: { id: '123' } } as any);

  return post;
};

const postByIdFiltering = (id: string, travelObj?: Partial<Post>) => {
  const { photoFn, travel, ...postResponse } = postById(id, travelObj);

  return {
    ...postResponse,
    photo: `/api/post/photo/${postResponse.id}`,
    authorId: travel.user.id,
    travelId: travel.id,
  };
};

describe('PostService', () => {
  let service: PostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    jest
      .spyOn(Post, 'findOne')
      .mockImplementation(async (options: any) => postById(options.where.id));

    jest
      .spyOn(Travel, 'findOne')
      .mockImplementation(async (options: any) => travelById(options.where.id));

    jest
      .spyOn(Post.prototype, 'save')
      .mockImplementation(async () => postById('123'));

    jest
      .spyOn(Post.prototype, 'remove')
      .mockImplementation(async () => postById('123'));

    jest
      .spyOn(PostService.prototype, 'findOneById')
      .mockImplementation(async (id: any) => postById(id));

    service = module.get<PostService>(PostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne should return travel with given id without sensitive data', async () => {
    const post = await service.findOne('123');
    expect(post).toEqual(postByIdFiltering('123'));
  });

  it('findOne should throw BadRequestError', async () => {
    await expect(async () => await service.findOne('')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('findOne should throw NotFoundException', async () => {
    jest
      .spyOn(PostService.prototype, 'findOneById')
      .mockImplementation(async () => null);

    await expect(async () => await service.findOne('1234')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('create should throw BadRequestException if travelId is empty', async () => {
    await expect(async () =>
      service.create('', new CreatePostDto(), undefined),
    ).rejects.toThrow(BadRequestException);
  });

  it('create should throw NotFoundException if travel not found', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async () => null);

    await expect(async () =>
      service.create('123', new CreatePostDto(), undefined),
    ).rejects.toThrow(NotFoundException);
  });

  it('create should return post', async () => {
    const post = await service.create('123', new CreatePostDto(), undefined);

    expect(post).toBeDefined();
  });
  //
  it('update should throw BadRequestException', async () => {
    await expect(
      async () => await service.update('', new UpdatePostDto(), undefined),
    ).rejects.toThrow(BadRequestException);
  });

  it('update should throw NotFoundException', async () => {
    jest
      .spyOn(PostService.prototype, 'findOneById')
      .mockImplementation(async () => null);

    await expect(
      async () => await service.update('123', new UpdatePostDto(), undefined),
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

  it('update should return travel', async () => {
    const post = await service.update('123', new UpdateTravelDto(), undefined);

    expect(post).toEqual(postByIdFiltering('123'));
  });

  it('remove should return post with given id and without sensitive data', async () => {
    const post = await service.remove('123');
    expect(post).toEqual(postByIdFiltering('123'));
  });

  it('remove should throw BadRequestException', async () => {
    await expect(async () => await service.remove('')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('remove should throw NotFoundException', async () => {
    jest
      .spyOn(PostService.prototype, 'findOneById')
      .mockImplementation(async () => null);

    await expect(async () => await service.remove('123')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getPhoto should throw BadRequestException', async () => {
    await expect(async () => await service.getPhoto('')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('getCountByUserId if id is empty throw BadRequestException', async () => {
    await expect(async () => service.getCountByUserId('')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('findAllByTravelId if id is empty throw BadRequestException', async () => {
    await expect(async () => service.findAllByTravelId('')).rejects.toThrow();
  });
});
