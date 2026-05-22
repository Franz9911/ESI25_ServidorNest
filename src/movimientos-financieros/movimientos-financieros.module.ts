import { Module } from '@nestjs/common';
import { MovimientosFinancierosService } from './movimientos-financieros.service';
import { MovimientosFinancierosController } from './movimientos-financieros.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientoFinanciero } from 'src/finanzas/entities/movimiento-financiero.entity';
//import { MovimientosFinancieros } from './entities/movimientos-financiero.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([MovimientoFinanciero]),
  ],
  controllers: [MovimientosFinancierosController],
  providers: [MovimientosFinancierosService],
})
export class MovimientosFinancierosModule {}
