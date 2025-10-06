import { Test, TestingModule } from '@nestjs/testing';
import { RepresentanteService } from './representante.service';

describe('RepresentanteService', () => {
  let service: RepresentanteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepresentanteService],
    }).compile();

    service = module.get<RepresentanteService>(RepresentanteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
