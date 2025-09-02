import { ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Marca } from './entities/marca.entity';
import { Repository } from 'typeorm';
import { throwError } from 'rxjs';
import { BuscarProductosDto } from 'src/producto/dto/find-producto.dto';
import { buscarMarcaDto } from './dto/buscar-marca.dto';

@Injectable()
export class MarcaService {
  constructor(
    @InjectRepository(Marca)
    private marcaRepository:Repository<Marca>
  ){}
  async crearMarcaSer(createMarcaDto: CreateMarcaDto) {
    const marcaExiste=await this.marcaRepository.findOne({
      where:{ nombre:createMarcaDto.nombre,}
    });
    if(marcaExiste){
      console.log("erroor2")
      throw new HttpException({
        status: HttpStatus.CONFLICT,
        error: `Ya existe un registro para la marca: ${createMarcaDto.nombre}`,
      }, HttpStatus.CONFLICT, {
          cause: `Ya existe un registro para la marca: ${createMarcaDto.nombre}`});
      
    }else{
      console.log("todo bienn")
     const nuevaMarca= await this.marcaRepository.save(createMarcaDto);
      return nuevaMarca;
    }
  }

  async buscarMarcaPorNombreSer(filtros:buscarMarcaDto) {
    const {nombre,limit,page}=filtros;
    const query =await this.marcaRepository.createQueryBuilder('marca');
    query.addSelect('marca');
    if(nombre){
      query.andWhere('LOWER(marca.nombre) LIKE LOWER(:nombre)', { //filtrar por nombre en la busqueda
        nombre: `%${nombre}%`,
      });
    }
    query.orderBy('marca.nombre','ASC');
    query.skip((page-1)*limit).take(limit);
    const [marcas,totalItems]=await query.getManyAndCount();
    console.log(marcas)
    return {
      totalItems,
      currentPage:+page,
      itemsPerPage:limit, 
      data:marcas,
    }
  }
  async VerificarMarca(id:number, nombre:string){
    const marcaExiste=await this.marcaRepository.findOne({
      where:{ 
        id:id,
        nombre:nombre,
      }
    });
    return marcaExiste;
  }

  findOne(id: number) {
    return `This action returns a #${id} marca`;
  }

  update(id: number, updateMarcaDto: UpdateMarcaDto) {
    return `This action updates a #${id} marca`;
  }

  remove(id: number) {
    return `This action removes a #${id} marca`;
  }
}
