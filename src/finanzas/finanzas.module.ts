import { Module } from '@nestjs/common';
import { FinanzasService } from './finanzas.service';
import { FinanzasController } from './finanzas.controller';
import { PagoModule } from './pago/pago.module';
//import { MoviminetoFinancieroModule } from './movimineto-financiero/movimineto-financiero.module';
import { MovimientoFinancieroService } from './movimiento-financiero/movimiento-financiero.service';
import { MovimientoFinancieroModule } from './movimiento-financiero/movimiento-financiero.module';
import { PagoService } from './pago/pago.service';

@Module({
  controllers: [FinanzasController],
  providers: [FinanzasService, MovimientoFinancieroService, PagoService],
  imports: [PagoModule, MovimientoFinancieroModule],
  exports:[FinanzasService]
})
export class FinanzasModule {}
