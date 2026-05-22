import { Module } from '@nestjs/common';
import { CompraService } from './compra.service';
import { CompraController } from './compra.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compra } from './entities/compra.entity';
import { PdfModule } from 'src/pdf/pdf.module';
import { Cotizacion } from './entities/cotizacion.entity';
import { ProveedorModule } from 'src/proveedor/proveedor.module';

import { CotizacionModule } from './cotizacion/cotizacion.module';
import { PagoCompraModule } from './pago-compra/pago-compra.module';
import { CuentasModule } from 'src/cuentas/cuentas.module';
import { InventarioModule } from 'src/inventario/inventario.module';

@Module({
  imports:[TypeOrmModule.forFeature([Compra, Cotizacion]),
  ProveedorModule,InventarioModule, CotizacionModule, PagoCompraModule, CuentasModule],
  controllers: [CompraController],
  providers: [CompraService],
  exports:[CompraService],
}) 
export class CompraModule {}
