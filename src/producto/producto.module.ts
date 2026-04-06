import { Module } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { ProductoController } from './producto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity';
import { MarcaModule } from 'src/marca/marca.module';
import { DetalleCompra } from 'src/compra/entities/detalle.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Producto,DetalleCompra]),
    MarcaModule,
  ],
  controllers: [ProductoController],
  providers: [ProductoService,],
  exports:[ProductoService],
})
export class ProductoModule {}
