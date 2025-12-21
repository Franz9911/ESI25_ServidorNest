import { BadGatewayException, BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { Compra } from './entities/compra.entity';
import { DetalleCompra } from './entities/detalle.entity';
import { Producto } from 'src/producto/entities/producto.entity';
import { throwError } from 'rxjs';
import { Proveedor } from 'src/proveedor/entities/proveedor.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanPagoCompra } from './entities/plan-pago.entity';
import { Representante } from 'src/representante/entities/representante.entity';
import { Cotizacion } from './entities/cotizacion.entity';
import { PdfService } from 'src/pdf/pdf.service';
import { BuscarCotizacionDto } from './dto/buscar-cotizacion.dto';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { ProveedorService } from 'src/proveedor/proveedor.service';
import { ActualizarCotizacionDto } from './dto/actualizar-cotizacion.dto';
import { start } from 'node:repl';
import { error } from 'node:console';
import { UpdatePlanPagoCompraDto } from './dto/update-plan-pago-compra.dto';
import { UpdateDetalle } from './dto/update-detalle.dto';

@Injectable()
export class CompraService {
  constructor(
    @InjectRepository(Compra)
    private compraRepository:Repository<Compra>,
    @InjectRepository(Cotizacion)
    private cotizacionRepository: Repository<Cotizacion>,
    private proveedorService:ProveedorService,
    private readonly dataSourse:DataSource,
    private  pdfService:PdfService,
    ){}
  //Compra
  /**
   * Objetivo: MODIFICAR la OC a la cual le designaremos un proveedor que participo en la etapa de cotizacion.
   * ademas se creara un plan de pagos y se asignara un precio unitario a cada detalle de compra. 
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
      const compra =await queryRunner.manager.findOne(Compra,{
        where:{id:idCompra},relations:['proveedor','detalles',]
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

      await this.modificarDetalleCompra(dto.detalles,compra,queryRunner);
      await this.crearPlanPago(dto.plan,compra,queryRunner);
      await this.modificarCotizacionAsignada(compra,idCotizacion,queryRunner);
      compra.proveedor=proveedor;
      compra.estadoRec=dto.estadoRec;
      compra.observaciones=dto.observaciones
      await queryRunner.manager.save(compra);
      console.log(dto);
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
  private async modificarCotizacionAsignada(compra:Compra, idCot:number,queryRunner:QueryRunner){
    const cotizacionExiste= await queryRunner.manager.findOne(Cotizacion,{
      where:{
        id:idCot,
        compra:{ id:compra.id}
      }
    });
    if(!cotizacionExiste){
      throw new BadRequestException('No se encontro la cotizacion Asignada');
    }
    cotizacionExiste.asignado="si";
    return await queryRunner.manager.save(cotizacionExiste);
  }
  private async modificarDetalleCompra(detallesDto:UpdateDetalle[],compra:Compra,queryRunner:QueryRunner){
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
      detalle.precioUnit=item.precioUnit; 
    }
    return await queryRunner.manager.save(detallesExisten);
  }
  private async crearPlanPago(planDto:UpdatePlanPagoCompraDto,compra:Compra,queryRunner:QueryRunner){
    console.log('plan:',planDto);
    const plan= queryRunner.manager.create(PlanPagoCompra,{
      numCuotas:planDto.numCuotas,
      monedaOperacion:planDto.monedaOperacion,
      montoTotalML:planDto.montoTotalML,
      montoTotalOperacion:planDto.montoTotalOperacion,
      tipoCambio:planDto.tipoCambio,
      frecuencia:planDto.frecuencia,
      saldoPendienteML:planDto.montoTotalML,
      saldoPendienteOperacion:planDto.montoTotalOperacion,
      fechaInicio:planDto.fechaInicio,
      fechaFin:planDto.fechaFin,
      estado:planDto.estado,
      compra:compra,
    });
    return await queryRunner.manager.save(plan);
  }

  //Listar compra
  /*filtros=>estado,rango de fecharegistro, razon social, representante
  salida=>compra.estado != cotizacion, compra.folder,compra.fecharegistro, 
    compra.proveedor.empresa, compra.representante.persona, detalles.total*/

  /**
   * Objetivo: ver de forma detallada una orden de compra "OC" 
   * @param id 
   * @returns 
   */
  VerOCServ(id: number) { 
    return this.compraRepository.findOne({
      where:{id},
      relations:['detalles','detalles.producto.marca','cotizaciones',
        'cotizaciones.representante.persona','cotizaciones.proveedor.empresa']
    });
  }

  /*Cotizaciones */

  /**
   * Objetivo: Esta funcion CREARA una orden de compra con un estado de "Cotizacion" adicionalmente 
   * se crearan todas las cotizaciones relacionadas con la compra, tambien se creara un pdf por cada cotizacion
   * @param dto 
   * @returns se retornara la compra registrada
   */
  async crearCotizacion(dto:CreateCompraDto){
    let detalles=[];
    let folderAux="";
    //console.log('crear cotizacion service',dto);
    const queryRunner=this.dataSourse.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
      const compra=queryRunner.manager.create(Compra,{
        estadoRec:dto.estadoRec,
        folder:null,
      });
      await queryRunner.manager.save(compra);
      //detalle contiene la lista de producto solicitados en la OC
      for(const item of dto.detalle){
        const producto =await queryRunner.manager.findOne(Producto,{
          where:{id:item.idProducto},relations:['marca']});
          console.log(producto);
          if(!producto){
            throw new NotFoundException(`no se encontro el producto ${item.idProducto}`)
          }
        const detalle=queryRunner.manager.create(DetalleCompra,{
          precioUnit:item.precioUnit, 
          unidAdquiridas:item.unidAdquiridas,
          unidDisponibles:item.unidDisponibles,
          producto:producto,
          compra:compra,
        });
        detalles.push(detalle);
        //registrar detalle
        await queryRunner.manager.save(detalle);  
      }
      //registrar cotizaciones
      for(const item of dto.cotizaciones){
        const proveedor =await queryRunner.manager.findOne(Proveedor,{
          where:{id:item.idProveedor},relations:['empresa'] 
        });
        if(!proveedor){
          throw new NotFoundException(`No se encontro el proveedor ${item.razonSocial}`);
        }
        const representante =await queryRunner.manager.findOne(Representante,{
          where:{ //consltamos si existe el representante y si pertenece a la empresa "proveedore"
            id:item.idRepresentante,
            empresa:{id:proveedor.empresa.id}
          }
        })
        if(!representante){
          throw new NotFoundException(`No se encontro al representa ${item.nombreRepresentante}`); 
        }
        const cotizacion =queryRunner.manager.create(Cotizacion,{
          compra:compra,
          proveedor:proveedor,
          representante:representante,
        });
        console.log('cotizacion',cotizacion);
        const columnas =[
          { header: 'Num.', key: 'id', width: 30 },
          { header: 'modelo', key: 'producto.modelo', width: 120 },
          { header: 'marca', key: 'producto.marca.nombre'},
          { header: 'unidades', key: 'unidAdquiridas', width: 80 },
        ];
        //crear pdf de la cotizacion
        folderAux=await this.pdfService.generarCotizacionPdf(cotizacion,detalles,columnas);
        await queryRunner.manager.save(cotizacion);
        
      }
      compra.folder=folderAux;
      await queryRunner.manager.save(compra);
      await queryRunner.commitTransaction();
      return compra;
    }catch(e){
      await queryRunner.rollbackTransaction();
      console.log(e)
      throw new BadRequestException(e);
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
    const estado='cotizacion';
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
      query.distinct(true);//evitar registros duplicados por usar muchos joins
    }
    if(folder){
      query.andWhere('LOWER(compra.folder) LIKE LOWER(:folder)', {
        folder: `%${folder}%`
      });
      query.distinct(true);//evitar registros duplicados por usar muchos joins
    }
    if(repreNombre){
      query.andWhere('LOWER(persona.nombre) LIKE LOWER(:nombre)', {
        nombre: `%${repreNombre}%`
      });
      query.distinct(true);//evitar registros duplicados por usar muchos joins
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
    const { razonSocial,folder,fechaInicio,fechaFin}=dto;
    const estado='cotizacion';
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
    let validar=false;
    console.log(dto);
    const compra=await this.compraRepository.findOne({
      where:{id},relations:['cotizaciones']
    })
    if(!compra){
      throw new NotFoundException('No se puede encontrar la compra')
    }
    const cotizacion= await this.cotizacionRepository.findOne({
      where:{id:cotizacionId}
    });
    if(cotizacion){
      //comparar con un bucle la cotizacion con cotizaciones 
      compra.cotizaciones.forEach((item)=>{
        if(item.id===cotizacion.id){
          validar=true;
        }
      })
    }
    if(!validar){
      throw new NotFoundException('No se puede encontrar la cotizacion');
    }
    Object.assign(cotizacion,{...dto});
    const cotizacionAux=await this.cotizacionRepository.save(cotizacion);

    return cotizacionAux;
  }

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
          id:dto.idCompra
        },relations:['detalles','detalles.producto.marca','cotizaciones']
      });
      if(!compra){
        throw new NotFoundException('No se encontro la compra');
      }      
      const proveedor =await queryRunner.manager.findOne(Proveedor,{
        where:{id:dto.idProveedor},relations:['empresa'] 
      });
      if(!proveedor){
        throw new NotFoundException(`No se encontro el proveedor`);
      }
      const representante =await queryRunner.manager.findOne(Representante,{
        where:{
          id:dto.idRepresentante,
          empresa:{id:proveedor.empresa.id}
        }
      })
      if(!representante){
        throw new NotFoundException(`No se encontro al representa`); 
      }
      for(const item of compra.cotizaciones){
        const cotizacionAux =await queryRunner.manager.findOne(Cotizacion,{
          where:{id:item.id},relations:['proveedor','representante']});
          console.log(cotizacionAux);
          if(cotizacionAux.proveedor.id ===proveedor.id && cotizacionAux.representante.id===representante.id){
            throw new NotFoundException(`La Orden de compra ya tiene una cotizacion para el representante del proveedor`)
          }
        }
      const cotizacion =this.cotizacionRepository.create({
        compra:compra,
        proveedor:proveedor,
        representante:representante,
      });
      const columnas =[
        { header: 'Num.', key: 'id', width: 30 },
        { header: 'modelo', key: 'producto.modelo', width: 120 },
        { header: 'marca', key: 'producto.marca.nombre'},
        { header: 'unidades', key: 'unidAdquiridas', width: 80 },
      ];
      const folderAux=await this.pdfService.generarCotizacionPdf(cotizacion,compra.detalles,columnas);
      await queryRunner.manager.save(cotizacion);
      await queryRunner.commitTransaction();
      return compra;
    }catch (e){
      await queryRunner.rollbackTransaction();
      console.log(e)
      throw new BadRequestException(e);
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
  async AgregarProductoCotizacionServ(dto:any){

  }

  remove(id: number) {
    return `This action removes a #${id} compra`;
  }
  async buscarCompraServ(){
    return await this.compraRepository.find({
      where:{estadoRec:'en camino'},
      relations:['detalles','planPagos','proveedor']
    })
  }
}
