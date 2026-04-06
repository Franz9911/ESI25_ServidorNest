import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateMovimientoInventarioDto } from '../dto/create-movimiento-inventario.dto';
import { EstadoLote, OrigenLote } from 'src/common/enums/estado-lote.enum';
import { DetalleCompra } from 'src/compra/entities/detalle.entity';
import { Lote } from 'src/inventario/entities/lote.entity';
import { Producto } from 'src/producto/entities/producto.entity';
import { QueryRunner } from 'typeorm';

@Injectable()
export class LoteService {
  async create(producto:Producto,detalle:DetalleCompra, queryRunner:QueryRunner, dto: CreateMovimientoInventarioDto) {          
    const lote = queryRunner.manager.create(Lote,{
      fechaIngreso:dto.fechaIngreso,
      estado: EstadoLote.INGRESADO,
      observaciones:dto.observaciones,
      origen:OrigenLote.DETALLE_COMPRA,
      unidadesIni:dto.unidadesIni,
      unidadesDis:dto.unidadesIni,
      detalleCompra:detalle,
      producto, 
    });
    const loteRegistrado =await queryRunner.manager.save(lote);
    return loteRegistrado;  
  }
}
