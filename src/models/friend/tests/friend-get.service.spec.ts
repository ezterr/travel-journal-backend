import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { FriendGetService } from '../friend-get.service';

const moduleMocker = new ModuleMocker(global);

describe('FriendGetService', () => {
  let service: FriendGetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FriendGetService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<FriendGetService>(FriendGetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
