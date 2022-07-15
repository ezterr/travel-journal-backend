import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { UserGetService } from '../user-get.service';

const moduleMocker = new ModuleMocker(global);

describe('UserGetService', () => {
  let service: UserGetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserGetService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<UserGetService>(UserGetService);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });
});
