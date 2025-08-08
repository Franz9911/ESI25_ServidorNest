import { ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Between, ILike, Repository } from 'typeorm';
import { Persona } from 'src/persona/entities/persona.entity';
import { PersonaService } from 'src/persona/persona.service';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';
import * as bcrypt from 'bcrypt'


@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository:Repository<Usuario>,
    private PersonaServ: PersonaService,
  ){}

  async buscarUsuarioPorNombre(username: string): Promise<any | undefined> {
    return this.usuarioRepository.findOne({ where: { nombreU:username } });
  }

  async CrearUsuario(createUsuarioDto: CreateUsuarioDto) {
    console.log("crear usuario")   
    const personaExiste = await this.PersonaServ.findOne(createUsuarioDto.persona.id);
    console.log(personaExiste);
    if(!personaExiste) throw new ConflictException("error: la persona no existe en la db")
    let personaConUsuario:any= await this.usuarioRepository.findOne({ //buscaremos si la persona tiene usuario
      where:{
        persona:{id:personaExiste.id}
      }
    });
    if(personaConUsuario){
      console.log(personaConUsuario);
      console.log("tiene usuario");
      throw new ConflictException("error: La persona ya tiene un usuario asignado");
    }else{
      //si la persona no tiene usuario comparamos el registro de la db con los datos enviados por el usuario 
      if(personaExiste.nombre==createUsuarioDto.persona.nombre &&
        personaExiste.apellidos==createUsuarioDto.persona.apellidos &&
        personaExiste.numDoc== createUsuarioDto.persona.numDoc){  
        const nuevoU:Usuario={
          id:0,
          nombreU:createUsuarioDto.nombreU,
          contrasenha:await bcrypt.hash(createUsuarioDto.contrasenha,10),
          estado:createUsuarioDto.estado,
          fotografia:createUsuarioDto.fotografia,
          fechaReg:new Date,
          rol:createUsuarioDto.rol,
          persona:personaExiste
        }      
        let usuarioA;
        return usuarioA= await this.usuarioRepository.save(nuevoU)   
      }else{
        console.log(personaExiste);//resultado null
        throw new HttpException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          error: 'Verifique los datos enviados!!',
        }, HttpStatus.UNPROCESSABLE_ENTITY, {
            cause: "Incoherencia de datos:"});
      }
    }
  }

  async BuscarTodosLosUsuariosSer() {
    return await this.usuarioRepository.find({relations:['persona'],order:{id:'DESC'}});
  }

  async BuscarTodosLosUsuariosSer2(nombre?:string,apellidos?:string,estado?:string,rol?:string,
    fechaInicio?:string,fechaFin?:string,page?:number,limit?:number): Promise<PaginacionResultado<Usuario>> {
    let fechaIn: Date | null = null;
    let fechaFi: Date | null = null;
    if(fechaInicio)fechaIn=new Date(`${fechaInicio} 00:00:00`);
    if(fechaFin)fechaFi=new Date(`${fechaFin} 23:59:59`)
    else fechaFi=new Date(`${fechaInicio} 23:59:59`)
    const [data, total]= await this.usuarioRepository.findAndCount({
      where:{
        // los ... son el "operador de propagacion" =>si fechaIn y fechaFi son null esa linea no se agrega a la consulta  
        ...(fechaIn && fechaFi && { fechaReg: Between(fechaIn, fechaFi) }),
        ...(estado && { estado: ILike(`%${estado}%`) }),
        ...(rol && { rol: ILike(`%${rol}%`) }),
        persona:{
          ...(nombre && { nombre: ILike(`%${nombre}%`) }),
          ...(apellidos && { apellidos: ILike(`%${apellidos}%`) }),
        }
      },
      relations:['persona'],
      order:{id:'DESC'},
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data,
      totalItems:total,
      currentPage:page,
      itemsPerPage:limit
    }
  }

  //buscar si la persona tiene registro de usuario
  async findOne(id: number) {
    return await this.usuarioRepository.findOne({
      where:{ persona:{id:id}}
    })
  }

  update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    return `This action updates a #${id} usuario`;
  }
  //eliminar los usarios y persona
  async EliminarUsuarioyPersonaServ(id:number,ci:number,personaId:number){
    let resultado  
    const usuario=await this.usuarioRepository.findOne({
      where:{id},relations: ['persona']});
    if(usuario){
      if(ci==usuario.persona.numDoc){
        resultado= await this.usuarioRepository.delete({id});
      }else{
         throw new HttpException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          error: 'Verifique los datos enviados!!',
        }, HttpStatus.UNPROCESSABLE_ENTITY, {
            cause: "datos no validos"});
      }
    }else{
      throw new HttpException({
        status: HttpStatus.NOT_FOUND,
        error: 'El registro de usuario no puede ser accedido!!',
        }, HttpStatus.NOT_FOUND, {
          cause: "recurso no encontrado en la DB"});
        }
    return resultado;
  }
    
}
