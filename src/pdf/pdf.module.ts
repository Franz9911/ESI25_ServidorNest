import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { ProveedorModule } from 'src/proveedor/proveedor.module';
import { CompraModule } from 'src/compra/compra.module';

@Module({
  imports:[
    ProveedorModule
  ],
  controllers: [PdfController],
  providers: [PdfService],
  exports:[PdfService],
})
export class PdfModule {}
