import { Body, Controller, Post } from '@nestjs/common';
import { FinanzasService } from './finanzas.service';
import { CreatePagoDto } from './dto/create-pago.dto';

@Controller('finanzas')
export class FinanzasController {
  constructor(private readonly finanzasService: FinanzasService) {}


}
