import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity';
import { Not, Repository } from 'typeorm';
import { BuscarProductosDto } from './dto/find-producto.dto';
import { MarcaService } from 'src/marca/marca.service';
import { console } from 'inspector';
import { error } from 'console';
import { Marca } from 'src/marca/entities/marca.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';


@Injectable()
export class ProductoService {

  private readonly logger= new Logger(ProductoService.name);
  constructor(
    @InjectRepository(Producto)
    private productoRepository:Repository<Producto>,
    private marcaService:MarcaService,
    private eventEmiter:EventEmitter2,
  ){}
  async crearProductoServ(createProductoDto: CreateProductoDto,marca:any, idResponsable:number) {
    const marcaExiste=await this.marcaService.VerificarMarca(marca.id,marca.nombre);
    if(!marcaExiste){//verificamos que la marca este registrada en la DB
      throw new UnprocessableEntityException('La Marca ingresada no existe en el registro de BD.');
    }
    const modeloDuplicado= await this.productoRepository.findOne({
      where:{
        modelo:createProductoDto.modelo,
        marca:{id:marcaExiste.id} 
      },relations:['marca'],
    });
    if(modeloDuplicado){
      //verificamos que el modelo y la marca del producto no coincida con ningun registro en la DB 
      throw new ConflictException('El producto ya existe en la DB') //funciona bien
    }
    //creams el nuevo producto
    const nuevaProducto:any={
      modelo:createProductoDto.modelo,
      descripTec:createProductoDto.descripTec,
      habilitarRefac:createProductoDto.habilitarRefac,
      habilitarVenta:createProductoDto.habilitarVenta,
      imagenProd:createProductoDto.imagenProd,
      marca:marcaExiste,
      minUnidades:createProductoDto.minUnidades,
      unidadesDis:createProductoDto.unidadesDis
    }
    const productoGuardado=await this.productoRepository.save(nuevaProducto);
    this.logger.log('nuevo',nuevaProducto)
    if(productoGuardado){
      this.eventEmiter.emit('producto.creado',{ //disparaos el evento.
        productoId:productoGuardado.id,
        //personaId:1,
        usuarioResponsable:idResponsable,
        datos:productoGuardado
      })
    }
    return{
      mensaje:'Producto registrado correctamente',
      data:productoGuardado
    }
  }

  async buscarProductosServ(filtros:BuscarProductosDto) {
    //const contiene todos los datos ingresados en filtros.
    const {marcaId,modelo,categoria,etiquetas,unidadesDis,modoEtiquetas,habilitarVenta,habilitarRefac,page,limit}=filtros;
    const query=this.productoRepository.createQueryBuilder('producto');
    this.logger.log('marca',typeof marcaId)  
// JOIN con la tabla marca
      query.leftJoinAndSelect('producto.marca', 'marca');
    
    if(etiquetas && etiquetas.length>0){ 
      //query.leftJoinAndSelect('producto.etiqueta','etiqueta');
      //de momento no tenemos etiquetas
    }

    // Filtro por id de marca
    if (marcaId !=='null') {
      query.andWhere('marca.id = :marcaId', { marcaId });
    }
    if(modelo){
      query.andWhere('LOWER(producto.modelo) LIKE LOWER(:modelo)',{
        modelo:`%${modelo}%`,
      });
    }
    if(habilitarVenta==='si'){
      query.andWhere('LOWER(producto.habilitarVenta) LIKE LOWER(:habilitarVenta)',{
        habilitarVenta:`%${habilitarVenta}`
      })
    }
    if(habilitarRefac==='si'){
      query.andWhere('LOWER(producto.habilitarRefac) LIKE LOWER(:habilitarRefac)',{
        habilitarRefac:`%${habilitarRefac}`
      })
    }

    if(unidadesDis !==undefined){
      query.andWhere('producto.unidadesDis >= :unidadesDisponibles',{
        unidadesDisponibles:unidadesDis,
      });
    }
    // Filtro por Etiquetas
    if (etiquetas && etiquetas.length > 0) {
      if (modoEtiquetas === 'any') {
        query.andWhere('etiqueta.nombre IN (:...etiquetas)', { etiquetas });
      } else if (modoEtiquetas === 'all') {
        query.andWhere('etiqueta.nombre IN (:...etiquetas)', { etiquetas });
        query.groupBy('producto.id');
        query.having('COUNT(DISTINCT etiqueta.nombre) = :cantidadEtiquetas', {
          cantidadEtiquetas: etiquetas.length,
        });
      }
    }
    query.orderBy('producto.marca','ASC');
    query.skip((page-1)*limit).take(limit);
    query.relation['marca'];
    const [productos,total]=await query.getManyAndCount();
    const currentPage=page; //esta lina se puede suprimir corregir el error primero
    return {
      
      totalItems:total,
      itemsPerPage:limit
      ,currentPage,limit, 
      data:productos,
    }
  }

  async buscarProductoPorIdServ(id: number) {
    this.logger.log(id);
   const producto= await this.productoRepository.findOne({
      where:{id:id},
      relations:['marca']
    })
    return producto; 
  }

  async actualizarSer(id: number, updateProductoDto: any,idResponsable:number) {
    const producto= await this.productoRepository.findOne({
      where:{id},
      relations:['marca']
    });
    if(!producto){ //si ingresamos un id que no existe en la tabla producto 
      throw new NotFoundException('No se encuentra el producto en la BD');
    }
    //verificar que la nueva marca es valida
    let marca=producto.marca ?? null; //si el producto recuperado de la db no tiene marca se guarda null   
    if(updateProductoDto.marcaId!==undefined ){ 
      if(marca.id !== +updateProductoDto.marcaId){//si son diferentes buscamos en la db.
        const marcaExiste= await this.marcaService.VerificarMarca(updateProductoDto.marcaId, updateProductoDto.marcaNombre);
        this.logger.log(JSON.stringify(marcaExiste));
        if(!marcaExiste){
          throw new UnprocessableEntityException('La marca ingresada no existe en la DB');
        }
        marca=marcaExiste;
      }
    }
    //verificar que el producto no se duplica
    const productoDuplicado=await this.productoRepository.findOne({
      where:{modelo:updateProductoDto.modelo,
        id:Not(id), //excluye el id que recibimos en la comparacion 
        marca:{id:marca.id}
      },relations:['marca'],
    })
    if(productoDuplicado){
      throw new ConflictException(`Ya existe un producto registrado con la marca`);
    }
    if(!updateProductoDto.imagenProd){
      updateProductoDto.imagenProd=producto.imagenProd;
    }
    Object.assign(producto,{...updateProductoDto,marca});
    const productoGuardado=await this.productoRepository.save(producto);
    if(productoGuardado){
      this.eventEmiter.emit('producto.modificado',{ //disparaos el evento.
        productoId:productoGuardado.id,
        //personaId:1,
        usuarioResponsable:idResponsable,
        datos:productoGuardado
      })
    }
    return productoGuardado;
  }

  async eliminarProductoServ(id: number) {
    if(id<1) throw new UnprocessableEntityException('El Id enviado no es valido');
    const resultado= await this.productoRepository.delete({id});

    if(resultado.affected===0){
      throw new NotFoundException(`No se encontró un producto en la DB`);
    }
    return {message: 'Producto eliminado correctamente!!'};
  }
}
