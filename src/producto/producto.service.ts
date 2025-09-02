import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity';
import { Repository } from 'typeorm';
import { BuscarProductosDto } from './dto/find-producto.dto';
import { MarcaService } from 'src/marca/marca.service';
import { console } from 'inspector';
import { error } from 'console';
import { Marca } from 'src/marca/entities/marca.entity';


@Injectable()
export class ProductoService {

  private readonly logger= new Logger(ProductoService.name);
  constructor(
   @InjectRepository(Producto)
   private productoRepository:Repository<Producto>,
   private marcaService:MarcaService,

  ){}
  async crearProductoServ(createProductoDto: CreateProductoDto,marca:any, id:number) {
    let productoAux:any;
    this.logger.log("dto:")
    const marcaExiste=await this.marcaService.VerificarMarca(marca.marcaId,marca.marcaNombre);
    if(marcaExiste){//verificamos ue la marca este registrada en la DB
      productoAux =createProductoDto
      productoAux.marca=marcaExiste;
    }else{
      throw new HttpException({
        status:HttpStatus.UNPROCESSABLE_ENTITY,
        error:'La Marca ingresada no existe en el registro de BD.'
      },HttpStatus.UNPROCESSABLE_ENTITY,{
        cause:'La Marca ingresada no existe en el registro de DB.'
      })
    }
    const modeloDuplicado= await this.productoRepository.findOne({
      where:{
        modelo:createProductoDto.modelo, 
      }
    });
    if(modeloDuplicado && marcaExiste.id=== +marca.marcaId ){
      //verificamos que el modelo y la marca del producto no coincida con ningun registro en la DB 
      throw new HttpException({
        status:HttpStatus.CONFLICT,
        error:'El producto ya existe en la DB'
      },HttpStatus.CONFLICT,{
        cause:'El producto ya existe en la DB'
      })
    }
    return await this.productoRepository.save(productoAux);
  }

  async buscarProductosServ(filtros:BuscarProductosDto) {
    //const contiene todos los datos ingresados en filtros.
    const {marcaId,modelo,categoria,etiquetas,unidadesDis,modoEtiquetas,page,limit}=filtros;
    const query=this.productoRepository.createQueryBuilder('producto');
    this.logger.log(unidadesDis)  
// JOIN con la tabla marca
      query.leftJoinAndSelect('producto.marca', 'marca');
    
    if(etiquetas && etiquetas.length>0){ 
      //query.leftJoinAndSelect('producto.etiqueta','etiqueta');
      //de momento no tenemos etiquetas
    }

    // Filtro por id de marca
    if (marcaId) {
      query.andWhere('marca.id = :marcaId', { marcaId });
    }
    if(modelo){
      query.andWhere('LOWER(producto.modelo) LIKE LOWER(:modelo)',{
        modelo:`%${modelo}%`,
      });
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
    return {
      total,page,limit, data:productos,
    }
  }

  buscarProductoPorIdServ(id: number) {
    return `This action returns a #${id} producto`;
  }

  update(id: number, updateProductoDto: UpdateProductoDto) {
    return `This action updates a #${id} producto`;
  }

  remove(id: number) {
    return `This action removes a #${id} producto`;
  }
}
