import { Module } from '@nestjs/common';
import { MovimientoInventarioService } from './movimiento-inventario.service';

@Module({
    providers:[MovimientoInventarioService],
    exports: [MovimientoInventarioService],
})
export class MovimientoInventarioModule {
    
}
