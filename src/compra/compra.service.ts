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
import { CreatePagoCompraDto } from './dto/create-pago.dto';
import { PlanPagoService } from './plan-pago/plan-pago.service';
import { CotizacionService } from './cotizacion/cotizacion.service';
import { PagoCompraService } from './pago-compra/pago-compra.service';
import { EstadoCompra } from 'src/common/enums/estado-compra.enum';
import { EstadoPago } from 'src/common/enums/estado-pago.enum';
import { CreateMovimientosFinancieroDto } from 'src/movimientos-financieros/dto/create-movimientos-financiero.dto';
import { CreateDetalleCompra } from './dto/create-detalle.dto';
import { EstadoCuota } from 'src/common/enums/estado-cuota.enum';
import { CuotaCompra } from './entities/cuota-compra.entity';
import { Lote } from 'src/inventario/entities/lote.entity';
import { PlanPagoCompra } from './entities/plan-pago.entity';
import { CreateDevolucionCompraDto } from './dto/create-devolucion-compra.dto';
import { DevolucionCompra } from './entities/devolucion-compra.entity';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';

@Injectable()
export class CompraService {
  constructor(
    @InjectRepository(Compra)
    private compraRepository:Repository<Compra>,
    @InjectRepository(Cotizacion)
    private cotizacionRepository: Repository<Cotizacion>,
    private readonly planPagoService:PlanPagoService,
    private readonly cotizacionService:CotizacionService,
    private readonly pagoCompraService:PagoCompraService,
    private readonly dataSourse:DataSource,
    ){} 

   /**
   * Objetivo: ver de forma detallada una orden de compra "OC" 
   * @param id 
   * @returns 
   */
    async VerCotizacionServ(id: number,relaciones:Array<string>) { 
      const OC = await this.compraRepository.findOne({
        where:{
          id
        },
        relations:relaciones
      });
      return OC;
    }

    async VerOrdenCompraServ(id: number,relaciones:Array<string>) { 
      const OC = await this.compraRepository.findOne({
        where:{
          id
        },
        relations:relaciones,
        order:{
          planPagos:{
            cuotas:{
              id:'ASC'
            }
          }
        }
      });
      return OC;
    }
  //Compra
  
  /**
   * Objetivo: MODIFICAR la Orden Compra a la cual le designaremos un proveedor que participo en la etapa de cotizacion.
   * ademas se creara un plan de pagos y se asignara un precio unitario y un subtotal a cada detalle de compra. 
   * @param dto 
   * @param idCompra 
   * @param IdUsuario 
   * @returns Compra
   */
  async asignarCompraProveedorServ(dto:UpdateCompraDto,idCompra:number,idCotizacion:number,IdUsuario:number){
    const queryRunner=this.dataSourse.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
      //necesitamos bloquear el recurso
      const compra =await queryRunner.manager.findOne(Compra,{
        where:{id:idCompra},
        lock:{mode:'pessimistic_write'},
      })
      if(!compra){
        throw new NotFoundException('La compra no existe');
      }
      const proveedor = await queryRunner.manager.findOne(Proveedor,{
        where:{id:dto.idProveedor}
      });
      if(!proveedor){
        throw new NotFoundException('No se encontrar al proveedor');
      }
      
      const tipoCambio=Number(dto.plan.tipoCambio);
      await this.modificarDetalleCompra(dto.detalles,tipoCambio,compra,queryRunner); //agregar el precio a cada detalle
      await this.planPagoService.registrarPlanPago(dto.plan,compra,queryRunner);
      const cotizacionA = await this.cotizacionService.buscarCotizacionAsignada(compra.id,idCotizacion,queryRunner);
      compra.proveedor=proveedor; 
      compra.cotizacionAsignada=cotizacionA;
      compra.estadoRec=dto.estadoRec;
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
 
  /**
   * NOTA: esta funcion es usada por asignarCompraProveedorServ()
   * Objetivo: AGREGAR el precio, unidPendientes  y subtotal a cada producto de la Orden de compra
   * @param detallesDto 
   * @param compra 
   * @param queryRunner 
   * @returns 
   * 
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
      //todo precio en detalle debe estar en moneda local;
      //agregarmos los precios de compra al registro de detalle 
      detalle.unidPendientes=detalle.unidAdquiridas;
      detalle.precioUnit= Number(item.precioUnit)*tipoCambio;
      detalle.subTotal=Number(item.precioUnit)*tipoCambio*Number(item.unidAdquiridas);
    }
    return await queryRunner.manager.save(detallesExisten);
  }
  private async registrarDetalleCompra(detallesDto:CreateDetalleCompra[],compra:Compra,queryRunner:QueryRunner){
    let detalles=[];
    //detalles contiene la lista de producto solicitados en la OC
    for(const item of detallesDto){
      const producto =await queryRunner.manager.findOne(Producto,{
        where:{id:item.idProducto},relations:['marca']});
        console.log(producto);
        if(!producto){
          throw new NotFoundException(`no se encontro el producto ${item.idProducto}`)
        }
      const detalle=queryRunner.manager.create(DetalleCompra,{
        unidAdquiridas:item.unidAdquiridas,
        producto:producto,
        compra:compra,
      });
      detalles.push(detalle);
      //registrar detalle
      await queryRunner.manager.save(detalle);  
      console.log(detalle);
    }
    return detalles
  }
  /**
   * Objetivo: Anular la orden de compra. esto implicar anular el plan de pagos y registrar devoluciones, las devoluciones no son obligatorias   
   * @param idOC 
   * @param motivo 
   * @param movimientos 
   * @returns se devolvera un mensaje de confirmacion con el id de compra
   */
  async anularCompra(idOC:number,motivo:string,movimientos:CreateMovimientosFinancieroDto[]):Promise<any>{
    //para movimiento necesitamos el monto, tipo de cambio y referencia 
    let totalMov:number=0;
    console.log('dentro del service anulando compra');
    console.log(movimientos);
    const queryRunner=this.dataSourse.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      
      const compra = await queryRunner.manager.findOne(Compra,{
        where:{id:idOC}, 
        lock:{mode:'pessimistic_write'},
        //relations:['planPagos', 'planPagos.cuotas'], //separar
      })
      if(!compra){
        throw new NotFoundException('No se pudo encontrar la compra');
      }
      if(compra.estadoRec === EstadoCompra.ANULADA){
        throw new ConflictException('La compra ya esta anulada');
      }
      //debemos crear un estado para completado y recepcionado para que esta no pueda ser anulada
      const lotes = await queryRunner.manager
        .createQueryBuilder(Lote, 'l')
        .innerJoin('l.detalleCompra', 'd')
        .innerJoin('d.compra', 'c')
        .where('c.id = :id', { id: idOC })
        .getCount();
      console.log('numero de lotes:', lotes)
      if(lotes>0){
        throw new ConflictException('No es posible anular la compra porque ya tiene productos registrados en el stock')
      } //de todas formas debemos revisar lotes
      compra.estadoRec = EstadoCompra.ANULADA;
      compra.motivoAnulacion=motivo;
      compra.fechaAnulacion=new Date();
      await  queryRunner.manager.save(compra);
      //console.log(compra);
      const planPagos = await queryRunner.manager.findOne(PlanPagoCompra,{
        where:{compra:{id:idOC}
        },relations:['cuotas'],
      });
      console.log(movimientos);
      await this.planPagoService.anularPlanPago(planPagos,queryRunner);
      movimientos.forEach(i=>{totalMov=i.monto});
      console.log('totalMov: ',totalMov);
      if(totalMov>0){
        if(planPagos.montoTotalOperacion>planPagos.saldoPendiente){
          await this.pagoCompraService.registrarDevolucion(planPagos,compra.id,movimientos,queryRunner); //movimiento va aqui
        }else{
          throw new BadRequestException('La compra no tiene pagos registrados por lo tanto no es posible registrar una devolucion')
        }
      }else{
        console.log('monto es 0: ' ,totalMov)
      }
      
    
      await queryRunner.commitTransaction();
      console.log('retornamos a compra')
      return {
        mensaje:`compra ${idOC} anulada`
      };
    } catch (error) {
      console.log(error);
      await queryRunner.rollbackTransaction() 
      throw error;
    } finally{
      await queryRunner.release()
    }
  }

  async devolucionCompra(dto:CreateDevolucionCompraDto,idCompra:number):Promise<any>{
    const queryRunner=this.dataSourse.createQueryRunner();
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
  async verMontoReembolsado(idPlan: number){
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
  }
  /*Cotizaciones */

  /**
   * Objetivo: CREAR una orden de compra con un estado de "COTIZACION" adicionalmente 
   * se crearan todos los registros de cotizacion pertenecientes a la orden de compra, 
   * tambien se creara un pdf por cada cotizacion,
   * @param dto 
   * @returns se retornara la compra registrada
   */
  async registrarOrdenCompraServ(dto:CreateCompraDto){
    const queryRunner=this.dataSourse.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
      const compra=queryRunner.manager.create(Compra,{
        estadoRec:dto.estadoRec,
        folder:null,
      });
      await queryRunner.manager.save(compra);
      //detalles contiene la lista de producto solicitados en la OC
      const detalles= await this.registrarDetalleCompra(dto.detalle,compra,queryRunner);
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
   * @returns =>compra.estado = cotizacion, compra.folder,compra.fecharegistro, 
   * cotizacion.proveedor.empresa cotizacion.representante.persona, cotizacion.total, cotizacion.pdfrespuesta,  
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

  async BuscarOrdenesCompraServ(dto:BuscarCotizacionDto){
    console.log("prueba")
    const { razonSocial,folder,fechaInicio,fechaFin}=dto;
    const estado=EstadoCompra.COTIZACION;
    let fechaIn:Date|null=null;
    let fechaFi:Date|null=null;
    const query=this.compraRepository.createQueryBuilder('compra');
    query.leftJoinAndSelect('compra.proveedor','proveedor');
    query.leftJoinAndSelect('proveedor.empresa','empresa');
    query.leftJoinAndSelect('compra.planPagos','planPagos');
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
    const queryRunner=this.dataSourse.createQueryRunner();
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
  /**
   * Objetivo: agregar productos a una OC registrada. solo se podra registrar productos si la OC 
   * tiene estado de "cotizacion"
   * @param dto 
   */

  //async AgregarProductoCotizacionServ(){
  //}


  //Nota: el sistema no permite el pago parcial de una cuota
  async registrarPagoServ(
    idOC:number,idCuota:number,dto:CreatePagoCompraDto,comprobantes:Express.Multer.File[] ){
    return this.pagoCompraService.registrarPago(idOC,idCuota,dto,comprobantes);
 
    //enviar las imagenes a pagoCompraService()
  }
 

  //Verplan de pagos
  async verPlanPago(idOC:number){
    const relaciones=['planPagos','planPagos.cuotas'];
    const compra = await this.VerOrdenCompraServ(idOC,relaciones);
    const PlanPagos=compra.planPagos;
    console.log(compra.planPagos);
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
    query.leftJoinAndSelect('compra.planPagos','planPagos');

    query.andWhere('compra.estadoRec <> :estado',{estado});
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

}
