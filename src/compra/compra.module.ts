import { Module } from '@nestjs/common';
import { CompraService } from './compra.service';
import { CompraController } from './compra.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compra } from './entities/compra.entity';
import { PdfModule } from 'src/pdf/pdf.module';
import { Cotizacion } from './entities/cotizacion.entity';
import { ProveedorModule } from 'src/proveedor/proveedor.module';
import { PlanPagoCompra } from './entities/plan-pago.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Compra, Cotizacion]),
  PdfModule,ProveedorModule],
  controllers: [CompraController],
  providers: [CompraService],
  exports:[CompraService],
})
export class CompraModule {}
