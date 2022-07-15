import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { PostGetService } from '../post-get.service';

const moduleMocker = new ModuleMocker(global);

describe('PostGetService', () => {
  let service: PostGetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostGetService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<PostGetService>(PostGetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
