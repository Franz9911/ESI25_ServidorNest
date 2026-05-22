import { Test, TestingModule } from '@nestjs/testing';
import { MovimientoFinancieroService } from './movimiento-financiero.service';

describe('MovimientoFinancieroService', () => {
  let service: MovimientoFinancieroService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MovimientoFinancieroService],
    }).compile();

    service = module.get<MovimientoFinancieroService>(MovimientoFinancieroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
