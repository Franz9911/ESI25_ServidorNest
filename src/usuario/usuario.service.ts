import { ConflictException,Logger, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Between, ILike, Repository } from 'typeorm';
import { Persona } from 'src/persona/entities/persona.entity';
import { PersonaService } from 'src/persona/persona.service';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  private readonly logger= new Logger(UsuarioService.name);
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository:Repository<Usuario>,
    private PersonaServ: PersonaService,
  ){}
  
  async contarUsuarios(){
    const usuariosContados = await this.usuarioRepository.count();
    return usuariosContados;
  }
  async crearUsuarioPorDefecto(persona:Persona){
    const contrasenha = await bcrypt.hash('Admin123%', 10);
    const usuario:Usuario = this.usuarioRepository.create({
      nombreU: 'Admin',
      contrasenha: contrasenha,
      rol: 'Admin',
      estado:'acti',
      persona:persona,
    });
  
    await this.usuarioRepository.save(usuario);
    console.log('********Usuario por defecto creado.***********');
    console.log("nombre: Admin");
    console.log("contraseña: Admin123%")
  }

  async buscarUsuarioPorNombre(username: string): Promise<any | undefined> {
    return this.usuarioRepository.findOne({ where: { nombreU:username } });
  }
  async CrearUsuario(createUsuarioDto: CreateUsuarioDto) {
    this.logger.log("crear usuario")   
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
  async buscarUsuarioId(id: number) {
    return await this.usuarioRepository.findOne({
      where:{ id:id},
        relations:['persona']
    })
  }
  //actualizar usuario 
  //entrada:estado, rol. 
  async actualizarUsuarioServ(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    const usuario= await this.usuarioRepository.findOne({
      where:{id},
      relations:['persona']
    });
    this.logger.log(usuario);
    if(!usuario)throw new NotFoundException('Usuario no encontrado');
    if(updateUsuarioDto.estado)usuario.estado=updateUsuarioDto.estado;
    if(updateUsuarioDto.rol)usuario.rol=updateUsuarioDto.rol;
    const usuarioDB =await this.usuarioRepository.save(usuario);
    const {contrasenha,estado,persona,rol,fechaReg, ...resultado}=usuarioDB;
    return resultado;
  }
  //editar mi perfil entrada:up:{"contrasenhaActual", "nuevaContrasenha", "nombreU", "fotografia"}
  async editarMiPerfilServ(up:any,usuarioId:string){
    console.log("en editarPerfilServ");
    const usuarioAux= await this.usuarioRepository.findOne({where:{id:+usuarioId},relations:['persona']});
    if(!usuarioAux){throw new UnauthorizedException("usuario no encontrado");}
    const contraseñaAct=await bcrypt.compare(up.contrasenhaActual,usuarioAux.contrasenha);//comparamos la contraseña de la db y la ingresada por teclado. 
    if(contraseñaAct){ //si las contraseñas son iguales editams los valores del usuarioAux.
      if(up.nuevaContrasenha) usuarioAux.contrasenha=await bcrypt.hash(up.nuevaContrasenha, 10); 
      if(up.nombreU) usuarioAux.nombreU=up.nombreU;
      if(up.fotografia) usuarioAux.fotografia=up.fotografia;
    }else{
      throw new UnauthorizedException('los datos ingresados no corresponden al usuario')
    }
    //guardamos los cambios en db.
    const resultado= await this.usuarioRepository.save(usuarioAux);
    return resultado;   
  }

  //eliminar los usarios
  async EliminarUsuarioServ(id:number,ci:number){
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