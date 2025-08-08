import { ConflictException, Injectable } from '@nestjs/common';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Persona } from './entities/persona.entity';
import { Repository } from 'typeorm';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';

@Injectable()
export class PersonaService {
  constructor(
    @InjectRepository(Persona)
    private personaRepository:Repository<Persona>
  ){}
  async create(createPersonaDto: CreatePersonaDto) {
      //verificar existencia de datos similares
      const personaExiste= await this.BuscarPorCedula(
        createPersonaDto.numDoc, createPersonaDto.tipoDoc)
      if(personaExiste){
        throw new ConflictException(`Error:Existe una persona registrada con este docuento: ${createPersonaDto.tipoDoc} ${createPersonaDto.numDoc}`);
      }else return await this.personaRepository.save(createPersonaDto);
  }

  async findAll(page?:number,limit?:number):Promise<PaginacionResultado<Persona>> {
    const[data,total]= await this.personaRepository.findAndCount({
      order:{id:'DESC'},
      skip:(page-1)*limit,
      take:limit
    });
    return{
      data,
      totalItems:total,
      currentPage:page,
      itemsPerPage:limit
    }
  }

  async findOne(id: number) {
    return await this.personaRepository.findOneBy({id});
  }
  async BuscarPorCedula(ci:number,tipoDoc:string){
    return await this.personaRepository.findOne({
      where:{
        numDoc:ci,
        tipoDoc:tipoDoc
      }
    })
  }

  async buscarPersonasSinUsuario(nombre?:string,apellidos?:string,page?:number,limit?:number): Promise<PaginacionResultado<Persona>> {
    //const [data,total]=await this.personaRepository
    console.log(apellidos);  
    const query = await this.personaRepository.createQueryBuilder('persona');
    //.createQueryBuilder('persona')
    query.leftJoin('persona.usuario', 'usuario');
    query.andWhere('usuario.id IS NULL');
      if(nombre){
        query.andWhere('LOWER(persona.nombre) LIKE LOWER(:nombre)', {
          nombre: `%${nombre}%`,
        });
      }
      if (apellidos) {
        query.andWhere('LOWER(persona.apellidos) LIKE LOWER(:apellidos)', {
          apellidos: `%${apellidos}%`,
        });
      }
      query.orderBy('persona.nombre','ASC')
      query.skip((page - 1) * limit)
      query.take(limit)
      const [data,total]= await query.getManyAndCount();
    return {
      data,
      totalItems:total,
      currentPage:page,
      itemsPerPage:limit
    }
  }

  update(id: number, updatePersonaDto: UpdatePersonaDto) {
    return `This action updates a #${id} persona`;
  }

  async remove(id: number) {
    return  await this.personaRepository.delete({id});
  }
}
