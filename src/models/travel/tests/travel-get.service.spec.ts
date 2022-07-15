import { Test, TestingModule } from '@nestjs/testing';
import { TravelGetService } from '../travel-get.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('TravelGetService', () => {
  let service: TravelGetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TravelGetService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<TravelGetService>(TravelGetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
