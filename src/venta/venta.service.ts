import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Brackets, DataSource, EntityNotFoundError, In, MoreThan, QueryRunner, Repository } from 'typeorm';
import { Venta } from './entities/venta.entity';
import { CreateDetalleVentaDto } from './dto/create-detalle-venta.dto';
import { Producto } from 'src/producto/entities/producto.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';
import { Lote } from 'src/inventario/entities/lote.entity';
import { DetalleLote } from 'src/inventario/entities/detalle-lote.entity';
import { InventarioService } from 'src/inventario/inventario.service';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';
import { FindVentaDto } from './dto/find-venta.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from 'src/cliente/entities/cliente.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { TipoCliente } from 'src/common/enums/tipo-cliente.enum';
import { CuentasService } from 'src/cuentas/cuentas.service';
import { PlanPagoService } from 'src/cuentas/plan-pago/plan-pago.service';
import { AnularPagoDto } from 'src/finanzas/dto/anular-pago-cuota.dto';
import { EstadoVenta, TipoVenta } from 'src/common/enums/venta.enum';
import { EstadoPago } from 'src/common/enums/estado-pago.enum';

@Injectable()
export class VentaService {
  private readonly logger =new Logger(VentaService.name);
  constructor(
    @InjectRepository(Venta)
    private ventaRepository:Repository<Venta>,
    private readonly dataSource: DataSource,
    private readonly inventarioService: InventarioService,
    private readonly cuentasService: CuentasService,
  ){}

  async verVentaDetalleServ(id: number,relaciones:Array<string>) { 
    console.log("ingresamos");
    const venta = await this.ventaRepository.createQueryBuilder('venta')
    .leftJoinAndSelect('venta.detalles','detalles')
    .leftJoinAndSelect('detalles.producto','producto')
    .leftJoinAndSelect('producto.marca','marca')
    .leftJoinAndSelect('venta.cliente','cliente')
    .leftJoinAndSelect('cliente.empresa','empresa')
    .leftJoinAndSelect('cliente.persona','persona')
  // plan de pagos
  .leftJoinAndSelect('venta.planPagos', 'planPago')
  
  // cuotas
  .leftJoinAndSelect('planPago.cuotas', 'cuota')

  // pagos SOLO registrados
  .leftJoinAndSelect(
    'cuota.pago',
    'pago',
    'pago.estado = :estado',
    { estado: EstadoPago.REGISTRADO }
  )

  .where('venta.id = :id', { id })

  .orderBy('cuota.id', 'ASC')

  .getOne();
    return venta;
  }
  async registrarVentaServ(dto: CreateVentaDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      //buscar cliente
      console.log('dddd movimientos en venta',dto.movimientos)
      const clienteExiste= await this.buscarCliente(dto, queryRunner);
      const venta =queryRunner.manager.create(Venta,{
        cliente: clienteExiste,
        estado:EstadoVenta.ACTIVO,
        tipo:dto.tipo as TipoVenta,
        concepto:dto.concepto,
      });
      //console.log(dto.planPago);
      const ventaAux=await queryRunner.manager.save(venta);
      console.log("detalles:",dto.detalles);
      const detalles= await this.registrarDetallesVenta(dto.detalles, venta, queryRunner);
      //const total tiene 3 valores{subTotalVenta, impuestoTotal, total} 
      //total.total es el valor de (subtotalVenta + impuestoTotal)*interes
      const total= await this.calcularTotal(detalles, dto.planPago.interes);
      await this.actualizarInventario(detalles, queryRunner);
      dto.planPago.montoTotal=total.totalBase;
      console.log('totales: ',total);
      
      const planPagos= await this.cuentasService.crearPlanPagoVenta(dto.planPago, venta, queryRunner, dto.movimientos);
      venta.planPagos=planPagos;
      venta.impuestoTotal=total.impuestoTotal;
      venta.subTotal=total.subTotalVenta; 
      await queryRunner.manager.save(venta)
      await queryRunner.commitTransaction();
      return venta;  
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log(error);
      throw error;
    }finally{
      await queryRunner.release();
    }
    
  }

  private async calcularTotal(detalles:DetalleVenta[], interes:number){
    console.log('detro de calcular total: ',detalles);
    if(interes<0){
      throw new BadRequestException('El interes no puede ser menor a cero');
    }
    let subTotalVenta:number=0;
    let impuestoTotal:number=0;
    let descuentoTotal:number=0;
    for(let item of detalles){
      const descuentoItem=item.descuento ?? 0;
      subTotalVenta +=Number(item.subTotal);
      impuestoTotal+=Number(item.ivaMonto);
      descuentoTotal+=Number(descuentoItem);
    }
    const totalBase=Number((subTotalVenta + impuestoTotal).toFixed(2));
    
    return {totalBase, impuestoTotal, subTotalVenta};
  }
  async buscarCliente(dto:CreateVentaDto, queryRunner:QueryRunner){
    let condicion;
    switch (dto.tipoCliente) {
      case TipoCliente.PERSONA:{
        condicion = { persona: { id: dto.cliPerEmpId } };
        break;
      }
      case TipoCliente.EMPRESA:{
        condicion = { empresa: { id: dto.cliPerEmpId } };
        break;
      }
      default:{
        throw new BadRequestException('Tipo de cliente no válido');
      }
    }
    const clienteExiste = await queryRunner.manager.findOne(Cliente, {
      where: condicion,
      lock: { mode: 'pessimistic_write' }
    });
    if(!clienteExiste){
      throw new NotFoundException('No se encuantra al cliente');
      //registrar cliente
    }
    return clienteExiste;
  }

  private async registrarDetallesVenta( detallesDto: CreateDetalleVentaDto[], venta: Venta, queryRunner: QueryRunner) {
    const ids = detallesDto.map(d => d.idProducto); //lo usamos para hacer la busqueda de productos
    const productos = await queryRunner.manager.find(Producto, {
      where: { id: In(ids) },
      lock: { mode: 'pessimistic_write' }
    });
    const productosMap = new Map(productos.map(p => [p.id, p])); //map de productos
    const detallesEntities: DetalleVenta[] = [];
  
    for (const item of detallesDto) {
      const producto = productosMap.get(item.idProducto); //emparejamos el prodcto con el detalle usando "item.idProducto"
      //es decir que del map sacaremos el producto que tenga el id === a item.idProducto 
      if (!producto) {
        throw new NotFoundException(`Producto ${item.idProducto} no existe`);
      }
      if (producto.habilitarVenta === 'no') {
        throw new NotAcceptableException(`Producto ${producto.id} no disponible`);
      }
      if (producto.unidadesDis < item.unidades) {
        throw new NotAcceptableException(
          `Stock insuficiente para producto ${producto.id}`
        );
      }
      //normalizacion de datos para evitar null o undefined
      const descuento = item.descuento || 0;
      const ivaPorcentaje = producto.iva || 0;
      
      if (item.unidades <= 0) {
        throw new BadRequestException('Unidades debe ser mayor a 0');
      }
      const subTotal = (item.unidades * producto.precioVenta) - descuento;
      const ivaMonto = subTotal * (ivaPorcentaje / 100);
      const totalDetalle = subTotal + ivaMonto;
      const precioFinalUnit = totalDetalle / item.unidades;
      const detalle = queryRunner.manager.create(DetalleVenta, {
        unidades: item.unidades,
        descuento,
        precioUnit: producto.precioVenta,
        precioFinalUnit, //precio final de venta por unidad
        ivaPorcentaje,
        ivaMonto,
        subTotal, //sin impuestos
        totalDetalle, //sub total + ivamonto
        venta, 
        producto 
      });
      detallesEntities.push(detalle);
    }
    const detallesGuardados = await queryRunner.manager.save(detallesEntities);
    return detallesGuardados;
  }
  private async actualizarInventario(detalles: DetalleVenta[], queryRunner: QueryRunner){
    for (const detalle of detalles){
      await this.inventarioService.descontarStockPorLotes(detalle.producto.id, detalle.unidades, detalle, queryRunner);
    }
  }

  async buscarVentasServ(dto: FindVentaDto):Promise<PaginacionResultado<Venta>>{
    const{nombreCliente,tipoCliente, tipo, estado, fechaInicio,fechaFin} =dto;
    console.log(fechaFin);
    console.log(fechaInicio);
    let fechaIn:Date|null=null;
    let fechaFi:Date|null=null;
    const query =this.ventaRepository.createQueryBuilder('venta');
    query.leftJoinAndSelect('venta.cliente','cliente');
    query.leftJoinAndSelect('cliente.persona','persona');
    query.leftJoinAndSelect('cliente.empresa','empresa');
    query.leftJoinAndSelect('venta.planPagos','planPagos');
    console.log( typeof tipoCliente, 'sin flitros');
    
    if(fechaInicio!='' && fechaInicio!='undefined'){
      fechaIn=new Date(`${fechaInicio} 00:00:00`);
      
      if(fechaFin!='' && fechaFin!='undefined'){
        fechaFi=new Date(`${fechaFin} 23:59:59`);
      }else{
        fechaFi=new Date(`${fechaInicio} 23:59:59`)
      }
      console.log('entramos2');
      query.andWhere('venta.fechaReg BETWEEN :fechaIn AND :fechaFi', {
        fechaIn,
        fechaFi,
      });
    }
    if(tipoCliente){
      console.log("entramos a tipoCliente");
      query.andWhere('cliente.tipoCliente = :tipoCliente',{tipoCliente})
    }
    console.log(tipoCliente, nombreCliente)
    if (nombreCliente) {
      query.andWhere(
        new Brackets(qb => {
    
          if (!tipoCliente || tipoCliente === TipoCliente.EMPRESA) {
           console.log('entramos a empresa', nombreCliente);
            qb.orWhere(
              'LOWER(empresa.razonSocial) LIKE LOWER(:razonSocial)',
              { razonSocial: `%${nombreCliente}%` }
            );
          }
    
          if (!tipoCliente || tipoCliente === TipoCliente.PERSONA) {
            console.log('entramos al persona',nombreCliente)
            qb.orWhere(
              'LOWER(persona.nombre) LIKE LOWER(:nombre)',
              { nombre: `%${nombreCliente}%` }
            );   
            qb.orWhere(
              'LOWER(persona.apellidos) LIKE LOWER(:apellidos)',
              { apellidos: `%${nombreCliente}%` }
            );
            qb.orWhere(
              `LOWER(CONCAT(persona.nombre, ' ', COALESCE(persona.apellidos, ''))) LIKE LOWER(:nombreCompleto)`,
              { nombreCompleto: `%${nombreCliente}%` }
            );
          }
        })
      );
    }
    if(tipo){
      console.log(tipo);
      query.andWhere('venta.tipo = :tipo',{tipo});
    }
    if(estado){
      query.andWhere('venta.estado = :estado',{estado});
    }
    query.distinct(true);//evitar registros duplicados por usar muchos joins
    query.skip((dto.paginaActual-1)* dto.datosPorPagina).take(dto.datosPorPagina);

    query.orderBy('venta.fechaReg','DESC');

    const [data, totalItems]=await query.getManyAndCount();

    const dataConTotal = data.map(v => ({
      ...v,
      total: Number(v.subTotal) + Number(v.impuestoTotal)
    }));

    return {
      totalItems, data: dataConTotal as any
    };
  }

  async anularVenta(idVenta:number, dto:AnularPagoDto):Promise<any>{
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const venta= await queryRunner.manager.findOne(Venta,{
        where:{
          id:idVenta,
        },loadRelationIds:{relations:['planPagos','detalles']},
         lock:{mode:'pessimistic_write'}
      });
      console.log(venta);
      await this.anularDetalleLotesVentaTotal(venta.detalles, queryRunner);

      if(!venta){
        throw new NotFoundException('Venta no encontrada');
      }
  
      if(venta.estado === EstadoVenta.ANULADA){
        throw new BadRequestException('La venta ya fue anulada');
      }
      if(!venta.planPagos){
        throw new NotFoundException('no se pudo encontrar el plan de pagos de la venta')
      }
      const idPlanPagos=Number(venta.planPagos);
      await this.cuentasService.anularPlanPago(idPlanPagos, dto,queryRunner);
      //await this.anularDetalleLotesVentaTotal(venta.detalles, queryRunner);
      await queryRunner.manager.update(Venta,{ id:venta.id },{
        estado: EstadoVenta.ANULADA,
        fechaAnulacion: new Date(),
        motivoAnulacion:dto.motivo,
      });
      //await queryRunner.commitTransaction();
      return {mensaje:"venta anulada correctamente"}
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log(error);
      throw error;
    }finally{
      await queryRunner.release();
    }
  }
  public async anularDetalleLotesVentaTotal(detalle:any, queryRunner:QueryRunner){
    //console.log(detalle);
    const idsDetalle:number[]=detalle;
    const detalles= await queryRunner.manager.find(DetalleVenta,{
      where:{        
        id:In(idsDetalle),     
      },loadRelationIds:{relations:['detalleLote', 'producto']},
      lock:{mode:'pessimistic_write'},
    });
    const idsProductos:number[]=[];
    for(const item of detalles){
      const idP: number= Number(item.producto);
      idsProductos.push(idP);
    }
    const productos =await queryRunner.manager.find(Producto,{
      where:{
        id:In(idsProductos),
      }, lock:{mode:'pessimistic_write'},
    });
    //console.log("productos inicio ",productos);
    const detallesMap= new Map(detalles.map(d=>[Number(d.producto),d]));
    //console.log("detalles ",detallesMap);
    for(const p of productos){
      const detalleAux=detallesMap.get(p.id)
      p.unidadesDis+=detalleAux.unidades;
    }
    await queryRunner.manager.save(productos);
    //console.log("productos final ",productos);
    
    await this.inventarioService.anularDetalleLotesVentaTotal(detalles,queryRunner);
    
  }
  update(id: number, updateVentaDto: UpdateVentaDto) {
    return `This action updates a #${id} venta`;
  }

  remove(id: number) {
    return `This action removes a #${id} venta`;
  }
}
