import { Module } from '@nestjs/common';
import { PagoCompraService } from './pago-compra.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compra } from '../entities/compra.entity';
//import { CuotaCompra } from '../entities/cuota-compra.entity';
//import { PagoCompra } from '../entities/pago-compra.entity';


import { MovimientoFinanciero } from 'src/finanzas/entities/movimiento-financiero.entity';

@Module({
  imports:[TypeOrmModule.forFeature([
      Compra,
      //CuotaCompra,
      //PagoCompra,
      MovimientoFinanciero
    ]),
   
  ],
  providers: [PagoCompraService],
  exports:[PagoCompraService],
})
export class PagoCompraModule {}
