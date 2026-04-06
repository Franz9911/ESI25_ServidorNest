import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';
import { CreateMovimientoInventarioDto } from './dto/create-movimiento-inventario.dto';
import { LoteService } from './lote/lote.service';
import { MovimientoInventarioService } from './movimiento-inventario/movimiento-inventario.service';
import { DataSource } from 'typeorm';
import { Producto } from 'src/producto/entities/producto.entity';
import { MoviminetoInventario } from './entities/movimiento-inventario.entity';
import { DetalleCompra } from 'src/compra/entities/detalle.entity';
import { SentidoMovFi, TipoMovFi } from 'src/common/enums/tipo-movimiento-inventario.enum';

@Injectable()
export class InventarioService {
  constructor(
    private readonly loteService:LoteService,
    private readonly movimientoIService:MovimientoInventarioService,
    private readonly dataSource: DataSource,
    ){}
  create(createInventarioDto: CreateInventarioDto) {
    
    return 'This action adds a new inventario';
  }
  async registrarIngreso(dto:CreateMovimientoInventarioDto){
    const queryRunner=this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      console.log('ingresamos a inventario service');
      const producto = await queryRunner.manager.findOne(Producto,{
        where:{id:dto.idProducto},
        lock: { mode: 'pessimistic_write' }
      });
      if(!producto){
        throw new NotFoundException('No se encontro el producto en la DB')
      }
      const detalle = await queryRunner.manager.findOne(DetalleCompra,{
        where:{id:dto.idDetalleCompra},
        lock:{mode:'pessimistic_write'},
      });
      console.log(detalle)
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
        tipo:TipoMovFi.RECEPCION_COMPRA,
        costoUnit:detalle.precioUnit,
        motivo:dto.motivo || "",
        sentido:SentidoMovFi.INGRESO,
        producto,
        lote, 
      })
      await this.movimientoIService.registrarMovimiento(movimiento, queryRunner);
      // 5. producto.stock += cantidad
      const productoActualizado= this.recalcularPrecio(producto,dto.unidadesIni,detalle.precioUnit);
      productoActualizado.unidadesDis+=dto.unidadesIni;
      await queryRunner.manager.save(productoActualizado);
      //modificar el estado de recepcion de compra
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
  recalcularPrecio(producto:Producto,unidadesIngresadas:number,precioDetalle:number){
    const nuevoStock = producto.unidadesDis+unidadesIngresadas;
    const nuevoPrecio = ((producto.unidadesDis*Number(producto.precio))+(unidadesIngresadas*Number(precioDetalle)))/nuevoStock;
    
    producto.precio= nuevoPrecio;
    //console.log('precioPro: ',producto.precio, 'productounid: ',producto.unidadesDis, 'unidadesIngre: ',unidadesIngresadas, 'detallePrecio: ' ,precioDetalle);
    //console.log('nuevoPrecio: ' ,nuevoPrecio);
    //console.log('nuevoStock: ',nuevoStock) 

    return producto;
  }
  findAll() {
    return `This action returns all inventario`;
  }

  findOne(id: number) {
    return `This action returns a #${id} inventario`;
  }

  update(id: number, updateInventarioDto: UpdateInventarioDto) {
    return `This action updates a #${id} inventario`;
  }

  remove(id: number) {
    return `This action removes a #${id} inventario`;
  }
}
