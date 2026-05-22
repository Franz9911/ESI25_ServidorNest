import { BadRequestException, ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { Compra } from './entities/compra.entity';
import { DetalleCompra } from './entities/detalle.entity';
import { Producto } from 'src/producto/entities/producto.entity';
import { Proveedor } from 'src/proveedor/entities/proveedor.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Cotizacion } from './entities/cotizacion.entity';
import { PdfService } from 'src/pdf/pdf.service';
import { BuscarCotizacionDto } from './dto/buscar-cotizacion.dto';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { ActualizarCotizacionDto } from './dto/actualizar-cotizacion.dto';
import { UpdateDetalle } from './dto/update-detalle.dto';
import { CotizacionService } from './cotizacion/cotizacion.service';
import { EstadoCompra } from 'src/common/enums/estado-compra.enum';
import { EstadoPago } from 'src/common/enums/estado-pago.enum';
import { CreateMovimientosFinancieroDto } from 'src/movimientos-financieros/dto/create-movimientos-financiero.dto';
import { CreateDetalleCompra } from './dto/create-detalle.dto';
import { EstadoCuota } from 'src/common/enums/estado-cuota.enum';
//import { CuotaCompra } from './entities/cuota-compra.entity';
import { Lote } from 'src/inventario/entities/lote.entity';
//import { PlanPagoCompra } from './entities/plan-pago.entity';
import { CreateDevolucionCompraDto } from './dto/create-devolucion-compra.dto';
import { DevolucionCompra } from './entities/devolucion-compra.entity';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';
import { CuentasService } from 'src/cuentas/cuentas.service';
import { CreatePlanPagoDto } from 'src/cuentas/dto/create-plan-pago.dto';
import { TipoCompraVentaEnum } from 'src/common/enums/tipo-compro-venta.enum';
import { AnularPagoDto } from 'src/finanzas/dto/anular-pago-cuota.dto';
import { EstadoLote } from 'src/common/enums/estado-lote.enum';
import { DetalleLote } from 'src/inventario/entities/detalle-lote.entity';
import { EstadoDetalleLote } from 'src/common/enums/detalle-lote.enum';
import { InventarioService } from 'src/inventario/inventario.service';

@Injectable()
export class CompraService {
  constructor(
    @InjectRepository(Compra)
    private compraRepository:Repository<Compra>,
    @InjectRepository(Cotizacion)
    private cotizacionRepository: Repository<Cotizacion>,
    private readonly inventarioService: InventarioService,
    private readonly cotizacionService:CotizacionService,
    private readonly cuentasService:CuentasService,
    private readonly dataSource:DataSource,
    ){} 
    //orden de compra: compra en etapa de cotizacion,
    //compra: compra asignada de forma directa o por cotiacion 
   /**
   * Objetivo: ver de forma detallada una orden de compra "OC" con sus cotizaciones 
   */
    async VerCotizacionServ(id: number,relaciones:Array<string>) { 
      const OC = await this.compraRepository.findOne({
        where:{id},relations:relaciones
      });
      return OC;
    }
    //ver compra a detalle
    async VerOrdenCompraServ(id: number,relaciones:Array<string>) { 
      const OC = await this.compraRepository.findOne({
        where:{id},
        relations:relaciones,
        order:{
          planPag:{cuotas:{id:'ASC'}}
        }
      });
      return OC;
    }
  
  /**
   * Objetivo: MODIFICAR la Orden Compra a la cual le designaremos un proveedor que participo en la etapa de cotizacion.
   * ademas se creara un plan de pagos y se asignara un precio unitario y un subtotal a cada detalle de compra. 
   */

  async asignarCompraProveedorServ(dto:UpdateCompraDto,idCompra:number,idCotizacion:number,IdUsuario:number){
    const queryRunner=this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    console.log('ingresamos a asignar cotizacion');
    try{
      const compra =await queryRunner.manager.findOne(Compra,{
        where:{id:idCompra},
        lock:{mode:'pessimistic_write'},
      });
      //?????definir un tipo de compra: credito o al contado 
      if(!compra){
        throw new NotFoundException('La compra no existe');
      }
      const proveedor = await this.buscarProveedor(dto.idProveedor,queryRunner);
      const tipoCambio=Number(dto.plan.tipoCambio);
      compra.tipo=dto.tipo as TipoCompraVentaEnum;
      //agregamos los precios a cada producto
      await this.modificarDetalleCompra(dto.detalles,tipoCambio,compra,queryRunner); 
      
      await this.cuentasService.crearPlanPagoCompra(dto.plan,compra, queryRunner, ) //agregar moviminetos financieros opcional
      const cotizacionA = await this.cotizacionService.buscarCotizacionAsignada(compra.id,idCotizacion,queryRunner);
      compra.proveedor=proveedor; 
      compra.cotizacionAsignada=cotizacionA;
      compra.estadoRec=dto.estadoRec as EstadoCompra;
      compra.observaciones=dto.observaciones;
      await queryRunner.manager.save(compra);
      await queryRunner.commitTransaction();
      return compra;
    }catch(e){
      await queryRunner.rollbackTransaction();
      console.log(e);
      throw e
    }finally{
      await queryRunner.release();
    }
  }
  
  //crear una una compra de forma directa sin cotizaciones
  async asignacionDirectaCompraServ(dto:CreateCompraDto){
    const queryRunner=this.dataSource.createQueryRunner();
    const planExiste:boolean=true;
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      //validar al proveedor
      const proveedor = await this.buscarProveedor(dto.idProveedor,queryRunner);
      const compra=queryRunner.manager.create(Compra,{
        estadoRec:dto.estadoRec as EstadoCompra,
        folder:null, // IMPORTANTE agregarFolder
        observaciones:dto.observacion,
        proveedor,
        //agregar concepto
        tipo:dto.tipo as TipoCompraVentaEnum,
      });
      await queryRunner.manager.save(compra);
      //detalles recibe los datos economicos en moneda de operacion
      const detalles= await this.registrarDetalleCompra(planExiste,dto.detalle,compra,queryRunner);
      //totales recibe los datos en moneda de operacion
      const totales=this.calcularTotal(detalles);
      dto.plan.montoTotal=totales.totalFinal;
      const concepto="compra de mercaderia";
      const plan = await this.cuentasService.crearPlanPagoCompra(dto.plan, compra,queryRunner,dto.movimientos);
      //compra guarda impuestos y subtotal en moneda de operacion
      compra.impuestoTotal=totales.impuestoTotal;
      compra.subTotal=totales.subTotalCompra;
      //en compra no se debe modificar los lotes ni inventario eso se hara en inventarioService
      await queryRunner.manager.save(compra);
      console.log(compra);
      await queryRunner.commitTransaction();
      return compra;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.log(e);
      throw e;
    }finally{
      await queryRunner.release()
    }
  }
  //calcular el total de una compra
  calcularTotal( detalles:DetalleCompra[]){
    //en detalle tenemos: precioUnit , ivaMonto, ivaProcentaje, unidAdquiridas  
    let subTotalCompra:number=0;
    let impuestoTotal:number=0;
    for(const item of detalles){
      subTotalCompra+=Number(item.subTotal);
      impuestoTotal+=Number(item.ivaMonto);
    }
    const totalFinal=Number((subTotalCompra+impuestoTotal).toFixed(2));
    return {
      subTotalCompra,
      impuestoTotal,
      totalFinal
    }
  }
  /**
   * NOTA: esta funcion es usada por asignarCompraProveedorServ()
   * Objetivo: AGREGAR el precio, unidPendientes  y subtotal a cada producto de la Orden de compra
   */
  private async modificarDetalleCompra(detallesDto:UpdateDetalle[], tipoCambio:number,compra:Compra,queryRunner:QueryRunner){
    if(!detallesDto || detallesDto.length===0){
      throw new BadRequestException('la compra debe tener por lo menos un producto asignado');
    }
    const detallesIds= detallesDto.map(d=>d.id); //guardamos los ids de detalles en una array
    const detallesExisten=await queryRunner.manager.find(DetalleCompra,{ //obtenemos los registros desde la DB
      where:{
        id:In(detallesIds),
        compra:{id:compra.id}
      },relations:['producto'],       
    });
    if(detallesExisten.length !== detallesIds.length){
      throw new NotFoundException('uno o mas detalles no pertenecen a la compra');
    }
    const detallesMap= new Map<number,DetalleCompra>( 
      //se crear un Map que referencia a las mismas instancias de detallesExisten
      detallesExisten.map(d=>[d.id,d])
    );
    for(const item of detallesDto){
      const detalle=detallesMap.get(item.id); //se optiene la referencia al mismo objeto de detallesExisten mediante el id
      //es decir que los cambios en la constante "detalle" afecta al item de detallesExisten
      if(!detalle){
        throw new NotFoundException(`no se encuentra el detalle ${item.id}`);
      }
      if(item.precioUnit<=0){
        throw new BadRequestException('El precio unitario debe ser mayor a 0');
      }
      //agregarmos los precios de compra al registro de detalle 
      detalle.unidPendientes=detalle.unidAdquiridas;
      detalle.precioUnit= Number(item.precioUnit)*tipoCambio;
      detalle.subTotal=Number(item.precioUnit)*tipoCambio*Number(item.unidAdquiridas);
    }
    return await queryRunner.manager.save(detallesExisten);
  }

  //si no existe un plan de pago es una cotizacion caso contrario es una compraDirecta
  private async registrarDetalleCompra(compraDirecta:boolean, detallesDto:CreateDetalleCompra[],compra:Compra,queryRunner:QueryRunner){
    let detalles=[];
    const ids = detallesDto.map(d => d.idProducto); //lo usamos para hacer la busqueda de productos
    const productos = await queryRunner.manager.find(Producto, {
      where: { id: In(ids) },
      lock: { mode: 'pessimistic_write' }
    });
    const productosMap = new Map(productos.map(p => [p.id, p])); //map de productos
    const detallesEntities: DetalleCompra[] = [];
    for(const item of detallesDto){
      const producto =productosMap.get(item.idProducto);
      console.log(producto);
      if(!producto){
        throw new NotFoundException(`no se encontro el producto ${item.idProducto}`)
      }
      const ivaPorcentaje=producto.iva || 0; //esto talves deberia venir del cliente?
      if(item.unidAdquiridas<=0){
        throw new BadRequestException(`Las unidades adquiridas para ${producto.modelo} deben ser mayores a 0`);
      }
      if(compraDirecta){
        //en detalle tenemos: precioUnit , ivaMonto, ivaProcentaje, unidAdquiridas  
      //en plan tenemos: tipoCambio, saldoPendiente=0, montoTotal, montoTotalML, mora=0, saldoPendienteML=0, totalRecargoMor=0
        const subTotal=Number((item.unidAdquiridas*item.precioUnit).toFixed(2)); //precioUnit en moneda de operacion
        const ivaMonto=Number((subTotal * (ivaPorcentaje / 100)).toFixed(2));
        const totalDetalle= Number((subTotal+ivaMonto).toFixed(2));   
        const precioFinalUnit = Number((totalDetalle / item.unidAdquiridas).toFixed(2));
        const detalle=queryRunner.manager.create(DetalleCompra,{
          unidAdquiridas:item.unidAdquiridas,
          unidPendientes:item.unidAdquiridas,
          subTotal:subTotal,
          precioUnit:item.precioUnit,
          precioFinalUnit,
          producto:producto,
          ivaPorcentaje:ivaPorcentaje,
          compra,
          ivaMonto,
        });
        detalles.push(detalle);
      }else{
        const detalle=queryRunner.manager.create(DetalleCompra,{
          unidAdquiridas:item.unidAdquiridas,
          producto:producto,
          compra:compra,
        });
        detalles.push(detalle);
      }
    }
    await queryRunner.manager.save(detalles); 
    return detalles
  }
  /**
   * Objetivo: Anular la orden de compra. esto implicar anular el plan de pagos y registrar devoluciones, 
   * las devoluciones no son obligatorias   
   */
  async anularCompra(idCompra:number, dto:AnularPagoDto):Promise<any>{
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const compra= await queryRunner.manager.findOne(Compra,{
        where:{
          id:idCompra,
        },loadRelationIds:{relations:['planPag','detalles']},
         lock:{mode:'pessimistic_write'}
      });
      console.log(compra);
      //anular lotes de compra
      const detalle:any[]=compra.detalles
      if(!compra){
        throw new NotFoundException('Compra no encontrada');
      }
  
      if(compra.estadoRec === EstadoCompra.ANULADA){
        throw new BadRequestException('La compra ya fue anulada');
      }
      if(!compra.planPag){
        throw new NotFoundException('no se pudo encontrar el plan de pagos de la compra')
      }
      const idPlanPagos=Number(compra.planPag);
      await this.cuentasService.anularPlanPago(idPlanPagos, dto,queryRunner);
      await this.anularLotesCompraTotal(detalle, queryRunner);
      await queryRunner.manager.update(Compra,{ id:compra.id },{
        estadoRec: EstadoCompra.ANULADA,
        fechaAnulacion: new Date(),
        motivoAnulacion:dto.motivo,
      });
      await queryRunner.commitTransaction();
      return {mensaje:"Compra anulada correctamente"}
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log(error);
      throw error;
    }finally{
      await queryRunner.release();
    }
  }
  //1. un detalleventa tienen muchos lotes 2. un lote tiene muchos detallesLote
  public async anularLotesCompraTotal(detalleCompra:number[], queryRunner:QueryRunner){
    const idsDetalleC:number[]=detalleCompra;
    const lotes= await queryRunner.manager.find(Lote,{
      where:{
        estado:EstadoLote.INGRESADO,      
        detalleCompra:{
          id:In(idsDetalleC),
        }
      },loadRelationIds:{relations:['producto','detallesLote']},
      lock:{mode:'pessimistic_write'},
    });
    for(const item of lotes){
      const unidadesVendidas=item.unidadesIni-item.unidadesDis;
      if(unidadesVendidas>0){
        throw new UnprocessableEntityException(`El lote ${item.id} ya cuenta con ventas registradas por ${unidadesVendidas} unid. La venta no se puede anular`);
      }
    }
    const idsLotes= lotes.map(l=>l.id);
    const idsProductos=[
      ...new Set(//set es una estructura que no permite elementos repetidos, set no es un array: set(2){3,5}
      //por eso usamos los tres puntos "..." que es combierten el set en un array  
      lotes.map(l => Number(l.producto)),
    )];
    const productos =await queryRunner.manager.find(Producto,{
      where:{
        id:In(idsProductos),
      }, lock:{mode:'pessimistic_write'},
    });

    const productoMap= new Map(productos.map(p=>[Number(p.id),p]));
    for(const l of lotes){ //puede haber un producto muchos lotes
      const producto = productoMap.get(Number(l.producto));
      if(!producto){
        throw new UnprocessableEntityException(`producto no encontrado`);
      }
      producto.unidadesDis-=l.unidadesIni;
      if(producto.unidadesDis<0){
        throw new UnprocessableEntityException(`El producto ${producto.modelo} quedara con stock negativo`);
      }
      //anular lotes
      l.estado=EstadoLote.ANULADO;
      l.fechaAnulacion=new Date();
    }
    await queryRunner.manager.save(productos);
    await queryRunner.manager.save(lotes); 
    await this.inventarioService.anularMoviminetosInvTotalCompra(idsLotes,queryRunner);
  }

  async devolucionCompra(dto:CreateDevolucionCompraDto,idCompra:number):Promise<any>{
    const queryRunner=this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const compra = await queryRunner.manager.findOne(Compra,{
        where:{id:idCompra},
        lock:{mode:'pessimistic_write'},
      });
      if(!compra){
        throw new NotFoundException('No se puede encontrar la compra en la DB');
      }
      /*if(compra.estadoRec===EstadoCompra.EN_CAMINO || compra.estadoRec===EstadoCompra.ANULADA){
        throw new ConflictException('No se puede registra la devolucion de una compra que no ha sido recibida o esta anulada');
      }*/
      const lote = await queryRunner.manager.findOne(Lote,{
        where:{
          id:dto.detallesDev.idLote,
          detalleCompra:{
            id:dto.detallesDev.idDetalleCompra,
          }
        },lock:{mode:'pessimistic_write'},
        relations:['detalleCompra'] //borrar
      });
      if(!lote){
        throw new NotFoundException('No se puede encontrar el lote');
      }
      if(lote.unidadesDis <=dto.detallesDev.unidadesDev ){
        throw new UnprocessableEntityException('El lote no cuenta con las unidades suficientes para realizar la devolucion');
      }
      let devolucionCompra = await queryRunner.manager.findOne(DevolucionCompra,{
        where:{
          compra:{id:compra.id}
        },relations:['detalleDevolucion']
      });
      if(devolucionCompra){
        console.log('devolucion:', devolucionCompra);
      }else{
        devolucionCompra = queryRunner.manager.create(DevolucionCompra,{
          compra,
          estado:'borrador',
          motivo:dto.motivo,
          montoTotalDev:0, //debe ser una suma de todas las devoluciones;
          usuarioId:1
        });
        console.log('devolucion2: ',devolucionCompra);
        //crear detalles
      }
      
      /**/
      const devolucionRegistrada = await queryRunner.manager.save(devolucionCompra);

      console.log(lote);
      //await queryRunner.commitTransaction()
      return compra
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }finally{
      await queryRunner.release();
    }
    
  }
  /*async verMontoReembolsado(idPlan: number){
    console.log('dentro del service anulando compra');
    
    const queryRunner=this.dataSourse.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const cuotaPagada = await queryRunner.manager.findOne(CuotaCompra,{ //buscando primer pago
      where:{ plan: { id: idPlan },estado: EstadoCuota.PAGADA,
      },
      relations:['pago'],
      order:{fechaPago: 'ASC'},
    }); 
    const totalReem = await this.pagoCompraService.verMontoReembolsado(cuotaPagada.pago.id, queryRunner)
    console.log('totalRemServCompra: ',totalReem );
    return totalReem;
  }*/
  /*Cotizaciones */

  /**
   * Objetivo: CREAR una orden de compra con un estado de "COTIZACION" adicionalmente 
   * se crearan todos los registros de cotizacion pertenecientes a la orden de compra, 
   * tambien se creara un pdf por cada cotizacion,
   * @param dto 
   * @returns se retornara la compra registrada
   */
  async registrarOrdenCompraServ(dto:CreateCompraDto){
    const queryRunner=this.dataSource.createQueryRunner();
    const planExiste:boolean=false;
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
      const compra=queryRunner.manager.create(Compra,{
        estadoRec:EstadoCompra.COTIZACION,
        tipo:TipoCompraVentaEnum.CREDITO,
        folder:null,
      });
      await queryRunner.manager.save(compra);
      //detalles contiene la lista de producto solicitados en la OC
      const detalles= await this.registrarDetalleCompra(planExiste, dto.detalle,compra,queryRunner);
      //registrar cotizaciones 
      compra.folder= await this.cotizacionService.registrarCotizacion(dto.cotizaciones,detalles,compra,queryRunner);

      await queryRunner.manager.save(compra);
      await queryRunner.commitTransaction();
      return compra;
    }catch(e){
      await queryRunner.rollbackTransaction();
      console.log(e)
      throw e;
    }finally{
      await queryRunner.release();
    }
  }
  /**
   * Objetivo: listar todas las cotizacione registradas en la db
   * @param dto filtros=>rago fecharegistro, razonsocial, representante.nombre, representante.apellidos,folder  
   */
  async BuscarCotizacionesServ(dto:BuscarCotizacionDto) { 
    const { razonSocial,folder,repreNombre,repreApellidos,fechaInicio,fechaFin}=dto;
    const estado=EstadoCompra.COTIZACION;
    let fechaIn:Date|null=null;
    let fechaFi:Date|null=null;
    const query=this.cotizacionRepository.createQueryBuilder('cotizacion');
    query.leftJoinAndSelect('cotizacion.compra','compra');
    query.leftJoinAndSelect('cotizacion.proveedor','proveedor');
    query.leftJoinAndSelect('proveedor.empresa','empresa');
    query.leftJoinAndSelect('cotizacion.representante','representante');
    query.leftJoinAndSelect('representante.persona','persona');
    query.andWhere('compra.estadoRec = :estado',{estado});
    if(fechaInicio){
      const inicio = `${fechaInicio} 00:00:00`;
      const fin    = `${fechaFin || fechaInicio} 23:59:59`;
      fechaIn = new Date(inicio);
      fechaFi = new Date(fin);
      query.andWhere('compra.fechaReg BETWEEN :fechaIn AND :fechaFi', {
        fechaIn,
        fechaFi,
      });
    }
    if(razonSocial){
      query.andWhere('LOWER(empresa.razonSocial) LIKE LOWER(:razonSocial)', {
        razonSocial: `%${razonSocial}%`
      });
    }
    if(folder){
      query.andWhere('LOWER(compra.folder) LIKE LOWER(:folder)', {
        folder: `%${folder}%`
      });
    }
    if(repreNombre){
      query.andWhere('LOWER(persona.nombre) LIKE LOWER(:nombre)', {
        nombre: `%${repreNombre}%`
      });
    }
    if(repreApellidos){
      query.andWhere('LOWER(persona.apellidos) LIKE LOWER(:apellidos)', {
        apellidos: `%${repreApellidos}%`
      });
      query.distinct(true);//evitar registros duplicados por usar muchos joins
    }
    query.orderBy('compra.fechaReg','DESC');
    query.skip((dto.paginaActual-1)* dto.datosPorPagina).take(dto.datosPorPagina);
    const [data,totalItems]=await query.getManyAndCount();
    return {
      totalItems,
      data
    } 
  }
  //buscar compra mediante el uso de filtros
  async BuscarOrdenesCompraServ(dto:BuscarCotizacionDto){
    console.log("prueba")
    const { razonSocial,folder,fechaInicio,fechaFin}=dto;
    const estado=EstadoCompra.COTIZACION;
    let fechaIn:Date|null=null;
    let fechaFi:Date|null=null;
    const query=this.compraRepository.createQueryBuilder('compra');
    query.leftJoinAndSelect('compra.proveedor','proveedor');
    query.leftJoinAndSelect('proveedor.empresa','empresa');
    query.leftJoinAndSelect('compra.planPag','planPag');
    query.andWhere('compra.estadoRec <> :estado',{estado});
    if(fechaInicio){
      const fechaIn = new Date(`${fechaInicio} 00:00:00`);
      const fechaFi = new Date(`${fechaFin ?? fechaInicio} 23:59:59`);
      query.andWhere('compra.fechaReg BETWEEN :fechaIn AND :fechaFi', {
        fechaIn,
        fechaFi,
      });
    }
    if(razonSocial){
      query.andWhere('LOWER(empresa.razonSocial) LIKE LOWER(:razonSocial)', {
        razonSocial: `%${razonSocial}%`
      });
    }
    if(folder){
      query.andWhere('LOWER(compra.folder) LIKE LOWER(:folder)', {
        folder: `${folder}%`
      });
      query.distinct(true);//evitar registros duplicados por usar muchos joins
    }
    query.orderBy('compra.fechaReg','DESC');
    query.skip((dto.paginaActual-1)* dto.datosPorPagina).take(dto.datosPorPagina);
    const [data,totalItems]=await query.getManyAndCount();
    return {
      totalItems,
      data
    } 
  }
  /**
   * Objetivo: agregar o modificar una cotizacion solo para el {total y pdfRespuesta} 
   * @param id identificador de compra
   * @param cotizacionId identificador de cotizacion
   * @param dto {total y pdfRespuesta}  
   * @param usuarioId usuario responsable
   * @returns cotizacion
   */
  async AgregarModificarRespuestaCotizacionServ(id: number,cotizacionId:number, dto: ActualizarCotizacionDto,usuarioId:number) {
    this.cotizacionService.actualizarRespuesta(id,cotizacionId,dto)
  } //falta terminar

  /**
   * Objetivo: agregar cotizacion a una OC despues de haber creado el registro, como un tipo de 
   * actualizacion a la OC. Al registra se creara el pdf solicitud de cotizacion 
   * @param dto 
   * @returns compra
   */
  async AgregarCotizacionServ(dto:CreateCotizacionDto){
    console.log('ingresamos a agregar cotizacion',dto.idProveedor)
    const queryRunner=this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const compra= await queryRunner.manager.findOne(Compra,{
        where:{
          id:dto.idCompra,
          estadoRec:EstadoCompra.COTIZACION,
        },relations:['detalles','detalles.producto.marca','cotizaciones']
      });
      if(!compra){
        throw new NotFoundException('No se encontro la compra');
      }      
      await this.cotizacionService.agregarCotizacion(dto,compra,queryRunner);
      await queryRunner.commitTransaction();
      return compra;
    }catch (e){
      await queryRunner.rollbackTransaction();
      console.log(e)
      throw e;
    }finally{
      await queryRunner.release();
    }
  }
  //si se agregar productos se debe borrar las respuestas ya resibidas y generar nuevos pdfs.
 
 
  //Verplan de pagos
  async verPlanPago(idOC:number){
    const relaciones=['planPag','planPag.cuotas'];
    const compra = await this.VerOrdenCompraServ(idOC,relaciones);
    const PlanPagos=compra.planPag;
    console.log(compra.planPag);
    return  PlanPagos 
  }

  async imprimir(dto:BuscarCotizacionDto): Promise<PaginacionResultado<Compra>>{
    const { razonSocial,folder,fechaInicio,fechaFin}=dto;
    const estado=EstadoCompra.COTIZACION;
    console.log('ingreee',dto)
    let fechaIn:Date|null=null;
    let fechaFi:Date|null=null;
    const query=this.compraRepository.createQueryBuilder('compra');
    query.leftJoinAndSelect('compra.proveedor','proveedor');
    query.leftJoinAndSelect('proveedor.empresa','empresa');
    query.leftJoinAndSelect('compra.planPag','planPag');

    query.andWhere('compra.estadoRec <> :estado',{estado});//diferente a estado
    if(fechaInicio!='' && fechaInicio!='undefined'){
      fechaIn=new Date(`${fechaInicio} 00:00:00`);
      console.log('entramos',fechaIn);
      if(fechaFin!='' && fechaFin!='undefined'){
        fechaFi=new Date(`${fechaFin} 23:59:59`);
      }else{
        fechaFi=new Date(`${fechaInicio} 23:59:59`)
      }
      query.andWhere('compra.fechaReg BETWEEN :fechaIn AND :fechaFi', {
        fechaIn,
        fechaFi,
      });
    }
    if(razonSocial){
      query.andWhere('LOWER(empresa.razonSocial) LIKE LOWER(:razonSocial)', {
        razonSocial: `%${razonSocial}%`
      });
    }
    if(folder){
      query.andWhere('LOWER(compra.folder) LIKE LOWER(:folder)', {
        folder: `${folder}%`
      });
      query.distinct(true);//evitar registros duplicados por usar muchos joins
    }
    query.orderBy('compra.fechaReg','DESC');
    //query.skip((dto.paginaActual-1)* dto.datosPorPagina).take(dto.datosPorPagina);
    const [data,totalItems]=await query.getManyAndCount();
    return {
      totalItems,
      data
    }
  }
  //Auxiliares
  //buscar proveedor para compra y cotizaciones
  async buscarProveedor(idProveedor:number, queryRunner:QueryRunner){
    const proveedor = await queryRunner.manager.findOne(Proveedor,{
      where:{id:idProveedor}
    });
    if(!proveedor){
      throw new NotFoundException('No se encontrar al proveedor');
    }
    return proveedor;
  }
}
