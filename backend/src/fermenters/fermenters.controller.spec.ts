import { Test, TestingModule } from '@nestjs/testing';
import { FermentersController } from './fermenters.controller';

describe('FermentersController', () => {
  let controller: FermentersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FermentersController],
    }).compile();

    controller = module.get<FermentersController>(FermentersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
