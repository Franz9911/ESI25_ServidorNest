import { Test, TestingModule } from '@nestjs/testing';
import { PagoCompraService } from './pago-compra.service';

describe('PagoCompraService', () => {
  let service: PagoCompraService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PagoCompraService],
    }).compile();

    service = module.get<PagoCompraService>(PagoCompraService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
