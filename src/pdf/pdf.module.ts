import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { ProveedorModule } from 'src/proveedor/proveedor.module';
import { CompraModule } from 'src/compra/compra.module';
import { PersonaService } from 'src/persona/persona.service';
import { PersonaModule } from 'src/persona/persona.module';
import { ProductoModule } from 'src/producto/producto.module';

@Module({
  imports:[
    ProveedorModule,PersonaModule,CompraModule,ProductoModule,
  ],
  controllers: [PdfController],
  providers: [PdfService],
  exports:[PdfService],
})
export class PdfModule {}
