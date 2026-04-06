import { Test, TestingModule } from '@nestjs/testing';
import { MovimientosFinancierosController } from './movimientos-financieros.controller';
import { MovimientosFinancierosService } from './movimientos-financieros.service';

describe('MovimientosFinancierosController', () => {
  let controller: MovimientosFinancierosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovimientosFinancierosController],
      providers: [MovimientosFinancierosService],
    }).compile();

    controller = module.get<MovimientosFinancierosController>(MovimientosFinancierosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
