import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Persona } from './entities/persona.entity';
import { Repository, Not } from 'typeorm';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PartialType } from '@nestjs/mapped-types';
import { FindPersonaDto } from './dto/find-persona.dto';

@Injectable()
export class PersonaService {
  constructor(
    @InjectRepository(Persona)
    private personaRepository:Repository<Persona>,
    private eventEmiter:EventEmitter2,
  ){}
  async crearPersonaPorDefecto(){
    const persona:Persona = this.personaRepository.create({
      nombre: 'Usuario',
      apellidos: 'Admin',
      celular:6666666,
      tipoDoc:'ci',
      numDoc:1000000,
      direccion:'calle Misteriosa'
    });
    await this.personaRepository.save(persona);
    return persona;
  }
  async create(createPersonaDto: CreatePersonaDto, responsable:number) {
      //verificar existencia de datos similares
      const personaExiste= await this.BuscarPorCedula(
        createPersonaDto.numDoc, createPersonaDto.tipoDoc)
      if(personaExiste){
        throw new ConflictException(`Error:Existe una persona registrada con este docuento: ${createPersonaDto.tipoDoc} ${createPersonaDto.numDoc}`);
      }else{
        const personaRegistrada=await this.personaRepository.save(createPersonaDto);
        console.log("disparando el evento!");
        if(personaRegistrada){
          this.eventEmiter.emit('persona.creada',{ //disparaos el evento.
            personaId:personaRegistrada.id,
            //personaId:1,
            usuarioResponsable:responsable,
            datos:personaRegistrada
          })
        }
        
        return personaRegistrada;
      } 
  }

  async findAll(dto:FindPersonaDto):Promise<PaginacionResultado<Persona>> {
    const {nombre,apellidos,numDoc,celular,fechaInicio, fechaFin,datosPorPagina,paginaActual}=dto;
    const query = await this.personaRepository.createQueryBuilder('persona'); //creamos una consul para la Db usand typeOrm
    console.log("numDoc",numDoc);
    let fechaIn: Date | null = null;
    let fechaFi: Date | null = null;
    // query.leftJoin('persona.usuario', 'usuario'); //unimos las tablas persona y usuarios atravez de id de usuario.
   // query.andWhere('usuario.id IS NULL'); //filtrar por id; si id es null persona se agrega al resultado de busqueda. 
   if(fechaInicio!='' && fechaInicio!='undefined'){
    fechaIn=new Date(`${fechaInicio} 00:00:00`);
    console.log('entramos',fechaIn);
    if(fechaFin!='' && fechaFin!='undefined'){
      fechaFi=new Date(`${fechaFin} 23:59:59`);
    }else{
      fechaFi=new Date(`${fechaInicio} 23:59:59`)
    }
    query.andWhere('persona.fechaReg BETWEEN :fechaIn AND :fechaFi', {
      fechaIn,
      fechaFi,
    });
  }
      if(nombre){
        query.andWhere('LOWER(persona.nombre) LIKE LOWER(:nombre)', { //filtrar por nombre en la busqueda
          nombre: `%${nombre}%`,
        });
      }
      if (apellidos) {
        query.andWhere('LOWER(persona.apellidos) LIKE LOWER(:apellidos)', { //filtrar por apellidos en la busqueda
          apellidos: `%${apellidos}%`,
        });
      }
      if (numDoc) {
        query.andWhere('CAST(persona.numDoc AS TEXT) LIKE :numDoc', { 
          numDoc: `%${numDoc}%` 
        });
      }
      if (celular) {
        query.andWhere('CAST(persona.celular AS TEXT) LIKE :celular', { 
          celular: `%${celular}%` 
        });
      }
      query.orderBy('persona.id','DESC')
      query.skip((paginaActual - 1) * datosPorPagina) //inicia la busqueda desde el id = ((page - 1) * limit)
      query.take(datosPorPagina) //si encuentra n registros detiene la busqueda. n=limit 
      const [data,totalItems]= await query.getManyAndCount(); //realizamos la consulta.
    return {
      data,
      totalItems,
    }
  }

  async buscarPorId(id: number) {
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
    const query = await this.personaRepository.createQueryBuilder('persona'); //creamos una consul para la Db usand typeOrm
    query.leftJoin('persona.usuario', 'usuario'); //unimos las tablas persona y usuarios atravez de id de usuario.
    query.andWhere('usuario.id IS NULL'); //filtrar por id; si id es null persona se agrega al resultado de busqueda. 
      
      if(nombre){
        query.andWhere('LOWER(persona.nombre) LIKE LOWER(:nombre)', { //filtrar por nombre en la busqueda
          nombre: `%${nombre}%`,
        });
      }
      if (apellidos) {
        query.andWhere('LOWER(persona.apellidos) LIKE LOWER(:apellidos)', { //filtrar por apellidos en la busqueda
          apellidos: `%${apellidos}%`,
        });
      }
      query.orderBy('persona.nombre','ASC')
      query.skip((page - 1) * limit) //inicia la busqueda desde el id = ((page - 1) * limit)
      query.take(limit) //si encuentra n registros detiene la busqueda. n=limit 
      const [data,totalItems]= await query.getManyAndCount(); //realizamos la consulta.
    return {
      data,
      totalItems,
    }
  }

  async update(id: number, dto: UpdatePersonaDto) {
    let personaExiste= await this.personaRepository.findOne({
      where:{id}
    });
    if(!personaExiste){
      throw new UnauthorizedException('La Persona no puede ser encontradaen en la DB');
    }
    const personaDuplicada=await this.personaRepository.findOne({
      where:{
        tipoDoc: dto.tipoDoc,
        numDoc: dto.numDoc,
        id: Not(id),
      }
    });
    if(personaDuplicada){
      throw new BadRequestException(`Este Docuento ya es registrado con ${personaDuplicada.nombre} ${personaDuplicada.apellidos}`)
    }
    personaExiste.nombre=dto.nombre;
    personaExiste.apellidos=dto.apellidos;
    personaExiste.celular=dto.celular;
    personaExiste.direccion=dto.direccion;
    personaExiste.numDoc=dto.numDoc;
    personaExiste.tipoDoc=dto.tipoDoc;
    personaExiste.correoE=dto.correoE;
    try {
      const personaAux= await this.personaRepository.save(personaExiste);
      return personaAux;
    } catch (error) {
      throw new ServiceUnavailableException('No se puede acceder a la DB!!')
    }
    
  }

  async remove(id: number) {
    return  await this.personaRepository.delete({id});
  }
  async Imprimir(dto:FindPersonaDto): Promise<PaginacionResultado<Persona>>{
    const {nombre,apellidos,numDoc,celular,fechaInicio, fechaFin}=dto;
    console.log(fechaFin);
    let fechaIn: Date | null = null;
    let fechaFi: Date | null = null;
    const query =this.personaRepository.createQueryBuilder('persona');
    //query.leftJoinAndSelect('persona.empresa','empresa');
    if(fechaInicio!='' && fechaInicio!='undefined'){
      fechaIn=new Date(`${fechaInicio} 00:00:00`);
      console.log('entramos',fechaIn);
      if(fechaFin!='' && fechaFin!='undefined'){
        fechaFi=new Date(`${fechaFin} 23:59:59`);
      }else{
        fechaFi=new Date(`${fechaInicio} 23:59:59`)
      }
      query.andWhere('persona.fechaReg BETWEEN :fechaIn AND :fechaFi', {
        fechaIn,
        fechaFi,
      });
    }
    if(nombre){
      query.andWhere('LOWER(persona.nombre) LIKE LOWER(:nombre)', {
        nombre: `%${nombre}%`
      });
    } 
    if(apellidos){
      query.andWhere('LOWER(persona.apellidos) LIKE LOWER(:apellidos)', {
        apellidos: `%${apellidos}%`
      });
    } 
    if (numDoc) {
      query.andWhere('CAST(persona.numDoc AS TEXT) LIKE :numDoc', { 
        numDoc: `%${numDoc}%` 
      });
    }
    if (celular) {
      query.andWhere('CAST(persona.celular AS TEXT) LIKE :celular', { 
        celular: `%${celular}%` 
      });
    }
     
    query.orderBy('persona.id','DESC');
    //query.skip((dto.paginaActual-1)* dto.datosPorPagina).take(dto.datosPorPagina);
    const [data,totalItems]=await query.getManyAndCount();
    return {
      totalItems,
      data
    }
  }
}
