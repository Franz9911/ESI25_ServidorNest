import { Test, TestingModule } from '@nestjs/testing';
import { MovimientoInventarioService } from './movimiento-inventario.service';

describe('MovimientoInventarioService', () => {
  let service: MovimientoInventarioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MovimientoInventarioService],
    }).compile();

    service = module.get<MovimientoInventarioService>(MovimientoInventarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
