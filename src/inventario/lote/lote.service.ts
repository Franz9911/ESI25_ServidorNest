import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateMovimientoInventarioDto } from '../dto/create-movimiento-inventario.dto';
import { EstadoLote, OrigenLote } from 'src/common/enums/estado-lote.enum';
import { DetalleCompra } from 'src/compra/entities/detalle.entity';
import { Lote } from 'src/inventario/entities/lote.entity';
import { Producto } from 'src/producto/entities/producto.entity';
import { In, QueryRunner } from 'typeorm';
import { DetalleLote } from '../entities/detalle-lote.entity';
import { EstadoDetalleLote } from 'src/common/enums/detalle-lote.enum';


@Injectable()
export class LoteService {
  async create(producto:Producto,detalle:DetalleCompra, queryRunner:QueryRunner, dto: CreateMovimientoInventarioDto) {          
    const lote = queryRunner.manager.create(Lote,{
      fechaIngreso:dto.fechaIngreso,
      estado: EstadoLote.INGRESADO,
      costoUnitML:detalle.precioUnit,
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
  //al anular una venta: el unico efecto que tienen en el lote es la agregacion de las unidades que fueron vendidas   
  //revertir los efectos de la venta en el lote
  async revertirEfectoVentaLote(lotes:Lote[], detallesLotes:DetalleLote[], queryRunner:QueryRunner){
    const detalleLoteMap= new Map (detallesLotes.map(dl=>[Number(dl.lote),dl]))
    for(const loteAux of lotes){
      const dl =detalleLoteMap.get(Number(loteAux.id));
      const unidades=loteAux.unidadesDis+dl.cantidad;
      loteAux.unidadesDis=unidades;
    }
    await queryRunner.manager.save(lotes);
  }

  //revertir los efectos de venta en detalle lote
  async revertirEfectoVentaDetalleLote(idsDetallesV:number[], queryRunner:QueryRunner){
    const detallesLotes = await queryRunner.manager.find(DetalleLote,{
      where:{    
        estado:EstadoDetalleLote.ACTIVO,
        detalleVenta:{id:In(idsDetallesV)}         
      },lock:{ mode:'pessimistic_write'}
    });
    for(const dLote of detallesLotes){
      dLote.estado=EstadoDetalleLote.ANULADA;
      dLote.fechaAnulacion=new Date();
    }
    await queryRunner.manager.save(detallesLotes);
  }

}
