import { Test, TestingModule } from '@nestjs/testing';
import { TravelController } from '../travel.controller';
import { TravelService } from '../travel.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('TravelController', () => {
  let controller: TravelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TravelController],
      providers: [TravelService],
    })
      .useMocker((token) => {
        // if (token === CatsService) {
        //   return { findAll: jest.fn().mockResolvedValue(results) };
        // }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = module.get<TravelController>(TravelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
