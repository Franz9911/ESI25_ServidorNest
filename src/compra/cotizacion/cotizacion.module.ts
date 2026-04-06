import { Module } from '@nestjs/common';
import { CotizacionService } from './cotizacion.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Representante } from 'src/representante/entities/representante.entity';
import { Proveedor } from 'src/proveedor/entities/proveedor.entity';
import { Cotizacion } from '../entities/cotizacion.entity';
import { PdfService } from 'src/pdf/pdf.service';

@Module({
  imports:[TypeOrmModule.forFeature([Cotizacion,Proveedor,Representante]),], 
  providers: [CotizacionService,PdfService],
  exports:[CotizacionService],
})
export class CotizacionModule {}
