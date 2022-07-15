import { Test, TestingModule } from '@nestjs/testing';
import { TravelService } from '../travel.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('TravelService', () => {
  let service: TravelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TravelService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<TravelService>(TravelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
