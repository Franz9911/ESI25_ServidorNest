import { Module } from '@nestjs/common';
import { PlanPagoService } from './plan-pago.service';

@Module({
  providers: [PlanPagoService]
})
export class PlanPagoModule {}
