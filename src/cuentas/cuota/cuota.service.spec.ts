import { Test, TestingModule } from '@nestjs/testing';
import { CuotaService } from './cuota.service';

describe('CuotaService', () => {
  let service: CuotaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CuotaService],
    }).compile();

    service = module.get<CuotaService>(CuotaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
