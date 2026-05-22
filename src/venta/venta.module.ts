import { Module } from '@nestjs/common';
import { VentaService } from './venta.service';
import { VentaController } from './venta.controller';
import { InventarioModule } from 'src/inventario/inventario.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta } from './entities/venta.entity';
import { CuentasModule } from 'src/cuentas/cuentas.module';

@Module({
  imports:[TypeOrmModule.forFeature([Venta]), 
    InventarioModule,CuentasModule,
  ],
  controllers: [VentaController],
  providers: [VentaService],
  
})
export class VentaModule {}
