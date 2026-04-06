import { Module } from '@nestjs/common';
import { PagoCompraService } from './pago-compra.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanPagoCompra } from '../entities/plan-pago.entity';
import { Compra } from '../entities/compra.entity';
import { CuotaCompra } from '../entities/cuota-compra.entity';
import { PagoCompra } from '../entities/pago-compra.entity';
import { MovimientosFinancieros } from 'src/movimientos-financieros/entities/movimientos-financiero.entity';
import { PlanPagoModule } from '../plan-pago/plan-pago.module';

@Module({
  imports:[TypeOrmModule.forFeature([
      Compra,PlanPagoCompra,CuotaCompra,PagoCompra,MovimientosFinancieros
    ]),
    PlanPagoModule,
  ],
  providers: [PagoCompraService],
  exports:[PagoCompraService],
})
export class PagoCompraModule {}
