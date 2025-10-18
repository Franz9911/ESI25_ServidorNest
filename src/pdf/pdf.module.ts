import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { ProveedorModule } from 'src/proveedor/proveedor.module';

@Module({
  imports:[
    ProveedorModule,
  ],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}
