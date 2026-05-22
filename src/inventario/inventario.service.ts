import { Injectable, InternalServerErrorException, Logger, NotAcceptableException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';
import { CreateMovimientoInventarioDto } from './dto/create-movimiento-inventario.dto';
import { LoteService } from './lote/lote.service';
import { MovimientoInventarioService } from './movimiento-inventario/movimiento-inventario.service';
import { DataSource, In, MoreThan, QueryRunner } from 'typeorm';
import { Producto } from 'src/producto/entities/producto.entity';
import { MoviminetoInventario } from './entities/movimiento-inventario.entity';
import { DetalleCompra } from 'src/compra/entities/detalle.entity';
import { DetalleVenta } from 'src/venta/entities/detalle-venta.entity';
import { Lote } from './entities/lote.entity';
import { DetalleLote } from './entities/detalle-lote.entity';
import { EstadoDetalleLote } from 'src/common/enums/detalle-lote.enum';
import { SentidoMovInventario, TipoMovInventario } from 'src/common/enums/tipo-movimiento-inventario.enum';
import { PlanPago } from 'src/cuentas/entities/planPago.entity';
import { Compra } from 'src/compra/entities/compra.entity';
import { EstadoCompra } from 'src/common/enums/estado-compra.enum';

@Injectable()
export class InventarioService { 
  private readonly logger = new Logger(InventarioService.name);
  constructor(
    private readonly loteService:LoteService,
    private readonly movimientoIService:MovimientoInventarioService,
    private readonly dataSource: DataSource,
  ){}

  async registrarIngreso(dto:CreateMovimientoInventarioDto){
    const queryRunner=this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      console.log('ingresamos a inventario service', dto);
      const producto = await queryRunner.manager.findOne(Producto,{
        where:{id:dto.idProducto},
        lock: { mode: 'pessimistic_write' }
      });
      if(!producto){
        throw new NotFoundException('No se encontro el producto en la DB')
      }
      const detalle = await queryRunner.manager.findOne(DetalleCompra,{
        where:{
          id:dto.idDetalleCompra,
        },
        loadRelationIds:{relations:['compra', ]},
        lock:{mode:'pessimistic_write'},
      });
      const idCompra=Number(detalle.compra);
      const planPago =await queryRunner.manager.findOne(PlanPago,{
        where:{
          compra:{id:idCompra}
        }
      }); 
      
      if(!detalle){
        throw new NotFoundException('No se encontro el detalle de compra');
      }
      if(detalle.unidPendientes-dto.unidadesIni < 0){
        throw new UnprocessableEntityException('El numero de unidades de los lotes supera a las unidades del detalle de compra');
      }
      detalle.unidPendientes-=dto.unidadesIni;
      await queryRunner.manager.save(detalle); 
      const lote = await this.loteService.create(producto,detalle,queryRunner,dto);
      //crear movimiento tipo INGRESO
      const movimiento = queryRunner.manager.create(MoviminetoInventario,{
        cantidad:dto.unidadesIni,
        tipo:TipoMovInventario.RECEPCION_COMPRA,
        costoUnit:detalle.precioUnit,
        motivo:dto.motivo || "",
        sentido:SentidoMovInventario.INGRESO,
        producto,
        lote,  
      });
      await this.movimientoIService.registrarMovimiento(movimiento, queryRunner);
      // producto.stock += cantidad
      const productoActualizado= this.recalcularPrecio(producto,dto.unidadesIni,detalle.precioUnit,planPago.tipoCambio);
      productoActualizado.unidadesDis+=dto.unidadesIni;
      await queryRunner.manager.save(productoActualizado);
      //IMPORTANTE  modificar el estado de recepcion de compra
      await this.verificarEstadoRecepcionCompra(idCompra, queryRunner);

      await queryRunner.commitTransaction();     
      return lote; 

    } catch (e) {  
      await queryRunner.rollbackTransaction();
      console.log(e);
      throw e
    } finally{
      await queryRunner.release(); 
    }
  } 
  async verificarEstadoRecepcionCompra(idCompra:number, queryRunner: QueryRunner){
    let contador=0;
    let estado=EstadoCompra.INGRESO_PARCIAL;
    const Detalles =await queryRunner.manager.find(DetalleCompra,{
      where:{
        compra:{id:idCompra}
      }
    });
    for(const d of Detalles){
      console.log("contador: ",contador);
      if(d.unidPendientes===0){
        contador++;
      }
    }
    const limite=Detalles.length;
    console.log("limite:" ,limite)
    switch(contador){
      case limite:{
        estado=EstadoCompra.INGRESADA;
        break;
      };
      default:{
        estado=EstadoCompra.INGRESO_PARCIAL;
        break;
      }
    } 
    await queryRunner.manager.update(Compra,{ id:idCompra },{
      estadoRec:estado as EstadoCompra,
    });
  }
  //Recalcular el precio de un producto al ingresar un nuevo lote
  recalcularPrecio(producto:Producto,unidadesIngresadas:number,precioDetalle:number, tipoCambio){
    const precioBOB= Number((precioDetalle*tipoCambio).toFixed(2))
    const nuevoStock = producto.unidadesDis+unidadesIngresadas;
    let nuevoCostoPromedio:number=0;
    if(nuevoStock===0){
      producto.costoPromedio=precioBOB;
    }else{
      nuevoCostoPromedio = ((producto.unidadesDis*Number(producto.costoPromedio))+(unidadesIngresadas*precioBOB))/nuevoStock;
      producto.costoPromedio= nuevoCostoPromedio;
    }    
    producto.precioVenta = Number((nuevoCostoPromedio * (1 + producto.margenGanancia/100)).toFixed(2));
    console.log("detalle ",precioDetalle)
    console.log("precio areglado ",producto)
    return producto;
  }
  //usado por ventas para seleccionar los lotes en FIFO
  async descontarStockPorLotes( productoId: number, cantidad: number, detalle: DetalleVenta, queryRunner: QueryRunner){
    this.logger.log('ingresamos al inventario_descontar')
    let restante = cantidad;
    let acumulado =0;
    const lotes = await queryRunner.manager.find(Lote, { 
      where: {
        producto: { id: productoId },
        unidadesDis: MoreThan(0)
      },
      order: {fechaIngreso: 'ASC'},//Trae los lotes ordenados en FIFO
      lock: { mode: 'pessimistic_write' } 
    });
    if (lotes.length === 0) {
      throw new NotAcceptableException('No hay stock disponible en lotes');
    }
    for (const lote of lotes) {
      if (restante <= 0) {
        if(restante< 0){
          this.logger.error('Restante negativo detectado', { productoId, restante, detalle}); 
          restante =0;
        }
        break;
      }
      const cantidadUsar = Math.min(lote.unidadesDis, restante); //todo lo ue podemos sacar de un lote
      acumulado+=cantidadUsar; //para restar al producto en unidades;
      lote.unidadesDis -= cantidadUsar;
      await queryRunner.manager.save(lote);
      //registrar detalleLote
      const detalleLote = queryRunner.manager.create(DetalleLote, {
        detalleVenta: detalle,
        lote: lote,
        estado:EstadoDetalleLote.ACTIVO,
        cantidad: cantidadUsar,
        costoUnitML: lote.costoUnitML,
      }); 
      const detalleLoteRegistrado = await queryRunner.manager.save(detalleLote);
      //verificar si funciona
      this.registrarSalida(detalle, detalleLoteRegistrado, 'venta', queryRunner);
      
      restante -= cantidadUsar;
    }
  
    if (restante > 0) { //si no existen suficientes unidades se cancela la operacion
      throw new NotAcceptableException(
        `Stock insuficiente en lotes para producto ${productoId}`
      );
    }
    if (acumulado !== cantidad) {
      throw new InternalServerErrorException('Inconsistencia de stock');
    }
    this.logger.debug(`Total descontado: ${acumulado}`);
    await queryRunner.manager.decrement(
      Producto,
      { id: productoId },
      'unidadesDis',
      acumulado // aquí sí puedes usarlo porque ya validaste todo antes
    );
  }
  //esto deberia estar en moviminetoInventarioService
  async registrarSalida( detalle:DetalleVenta, detalleLote:DetalleLote, motivo:string, queryRunner:QueryRunner){
    //crear movimiento tipo salida
    const movimiento = queryRunner.manager.create(MoviminetoInventario,{
      cantidad:detalleLote.cantidad,
      tipo:TipoMovInventario.SALIDA_VENTA,
      costoUnit:detalle.precioUnit,
      motivo:motivo,
      sentido:SentidoMovInventario.SALIDA,
      producto:detalle.producto,
      lote:detalleLote.lote, 
      detalleLote:detalleLote,
    });
    await queryRunner.manager.save(movimiento)
  }
  //anular el efecto de todos los DetalleLote de la venta anulada 
  public async anularDetalleLotesVentaTotal(detallesVenta:any[], queryRunner:QueryRunner){
    console.log('inventario serv anular detalle lote');
    if(detallesVenta.length===0){
      return;
    }
    const idsDetallesV = detallesVenta.map(d => d.id);     
    const detallesLotes = await queryRunner.manager.find(DetalleLote,{
      where:{    
        estado:EstadoDetalleLote.ACTIVO,
        detalleVenta:{id:In(idsDetallesV)}  //filtra los detalles que necesitamos       
      },loadRelationIds:{relations:['lote', 'movimientosInventario']},
        lock:{ mode:'pessimistic_write'}
    });
    //cada item de loteMap contiene en dl: el idLote y idDetalleLote, y tiene el idMovInvetario como indice 
    const loteMap= new Map(detallesLotes.map(dl=>[dl.movimientosInventario[0],dl]) );//parametros : idMoviminetoinventario,DetalleLote
    const idsLotes=detallesLotes.map(l=>l.lote);
    const lotes= await queryRunner.manager.find(Lote,{
      where:{
        id: In(idsLotes), //filtra los lotes necesarios
      },loadRelationIds:{relations:['movimientosInventario']}, 
    });
    const idsMovimientos = [
      ...new Set(detallesLotes.flatMap(
        d => d.movimientosInventario as any[]
    ))];
    
    //console.log(movimientos);
    await this.loteService.revertirEfectoVentaDetalleLote(idsDetallesV, queryRunner);
    await this.loteService.revertirEfectoVentaLote(lotes, detallesLotes, queryRunner);
    const tipo=TipoMovInventario.DEVOLUCION_CLIENTE;
    await this.movimientoIService.anularMovimientosInventario(tipo,idsMovimientos,loteMap,queryRunner);
  }
  public async anularMoviminetosInvTotalCompra(idsLote:number[],queryRunner:QueryRunner){
    console.log('en invetario service');
    if(idsLote.length===0){
      return;
    }
    const movI= await queryRunner.manager.find(MoviminetoInventario,{
      where:{
        anulado:false,
        lote:{id:In(idsLote),}
      },loadRelationIds:{relations:['lote']},
      lock:{mode:'pessimistic_write'}, 
    });
    console.log(movI);
    const loteMap= new Map(movI.map(m=>[m.id,{'lote':m.lote,'id':null}]));//parametros : idMoviminetoinventario,DetalleLote
    const idsMovInventario= movI.map(m=>m.id);
    const tipo=TipoMovInventario.DEVOLUCION_PROVEEDOR;
    await this.movimientoIService.anularMovimientosInventario(tipo,idsMovInventario,loteMap,queryRunner);

  }
  findAll() {
    return `This action returns all inventario`;
  }

  findOne(id: number) {
    return `This action returns a #${id} inventario`;
  }


}
