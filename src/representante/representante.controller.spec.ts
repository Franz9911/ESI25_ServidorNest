import { Test, TestingModule } from '@nestjs/testing';
import { RepresentanteController } from './representante.controller';
import { RepresentanteService } from './representante.service';

describe('RepresentanteController', () => {
  let controller: RepresentanteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepresentanteController],
      providers: [RepresentanteService],
    }).compile();

    controller = module.get<RepresentanteController>(RepresentanteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
