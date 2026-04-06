import { Test, TestingModule } from '@nestjs/testing';
import { MovimientosFinancierosService } from './movimientos-financieros.service';

describe('MovimientosFinancierosService', () => {
  let service: MovimientosFinancierosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MovimientosFinancierosService],
    }).compile();

    service = module.get<MovimientosFinancierosService>(MovimientosFinancierosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
