import { Module } from '@nestjs/common';
import { CuentasService } from './cuentas.service';
import { CuentasController } from './cuentas.controller';
import { PlanPagoModule } from './plan-pago/plan-pago.module';
import { CuotaModule } from './cuota/cuota.module';
import { PlanPagoService } from './plan-pago/plan-pago.service';
import { CuotaService } from './cuota/cuota.service';
import { FinanzasModule } from 'src/finanzas/finanzas.module';

@Module({
  controllers: [CuentasController],
  providers: [CuentasService,PlanPagoService, CuotaService],
  imports: [PlanPagoModule, CuotaModule, FinanzasModule],
  exports:[CuentasService]
}) 
export class CuentasModule {}
