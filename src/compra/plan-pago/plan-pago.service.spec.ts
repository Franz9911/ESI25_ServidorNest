import { Test, TestingModule } from '@nestjs/testing';
import { PlanPagoService } from './plan-pago.service';

describe('PlanPagoService', () => {
  let service: PlanPagoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanPagoService],
    }).compile();

    service = module.get<PlanPagoService>(PlanPagoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
