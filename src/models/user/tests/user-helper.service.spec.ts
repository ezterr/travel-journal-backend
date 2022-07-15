import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { UserHelperService } from '../user-helper.service';

const moduleMocker = new ModuleMocker(global);

describe('UserHelperService', () => {
  let service: UserHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserHelperService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();
    service = module.get<UserHelperService>(UserHelperService);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });
});
