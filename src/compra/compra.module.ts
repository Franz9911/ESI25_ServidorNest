import { Module } from '@nestjs/common';
import { CompraService } from './compra.service';
import { CompraController } from './compra.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compra } from './entities/compra.entity';
import { PdfModule } from 'src/pdf/pdf.module';
import { Cotizacion } from './entities/cotizacion.entity';
import { ProveedorModule } from 'src/proveedor/proveedor.module';
import { PlanPagoService } from './plan-pago/plan-pago.service';
import { PlanPagoModule } from './plan-pago/plan-pago.module';
import { CotizacionModule } from './cotizacion/cotizacion.module';
import { PagoCompraModule } from './pago-compra/pago-compra.module';

@Module({
  imports:[TypeOrmModule.forFeature([Compra, Cotizacion]),
  ProveedorModule, PlanPagoModule, CotizacionModule, PagoCompraModule],
  controllers: [CompraController],
  providers: [CompraService],
  exports:[CompraService],
})
export class CompraModule {}
