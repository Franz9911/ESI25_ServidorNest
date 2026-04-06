import { Module } from '@nestjs/common';
import { MovimientosFinancierosService } from './movimientos-financieros.service';
import { MovimientosFinancierosController } from './movimientos-financieros.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientosFinancieros } from './entities/movimientos-financiero.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([MovimientosFinancieros]),
  ],
  controllers: [MovimientosFinancierosController],
  providers: [MovimientosFinancierosService],
})
export class MovimientosFinancierosModule {}
