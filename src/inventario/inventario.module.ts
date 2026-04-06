import { Module } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { InventarioController } from './inventario.controller';
import { LoteModule } from './lote/lote.module';
import { MovimientoInventarioService } from './movimiento-inventario/movimiento-inventario.service';
import { MovimientoInventarioModule } from './movimiento-inventario/movimiento-inventario.module';

@Module({
  controllers: [InventarioController],
  providers: [InventarioService, MovimientoInventarioService],
  imports: [LoteModule, MovimientoInventarioModule],
  exports:[InventarioService],
})
export class InventarioModule {}
