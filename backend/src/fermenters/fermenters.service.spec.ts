import { Test, TestingModule } from '@nestjs/testing';
import { FermentersService } from './fermenters.service';

describe('FermentersService', () => {
  let service: FermentersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FermentersService],
    }).compile();

    service = module.get<FermentersService>(FermentersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
