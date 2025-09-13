import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from 'src/usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt  from 'bcrypt';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { EmailService } from './common/email-service';
import { NuevaContrasenhaDto } from './dto/nuevaContrasenha.dto';



@Injectable()
export class AutenticacionService {
  private refreshTokens=new Map<number,string>();
  private codigosActivos=new Map<string,{codigo:string,expiraEn:number,id:number}>();
    constructor(
        private usuarioService:UsuarioService,
        private emailservice:EmailService,
        private jwtService:JwtService, 
    ){}
    async validarUsuario(login:LoginDto){
      const usuarioValido=await this.usuarioService.buscarUsuarioPorNombre(login.nombreU);
      console.log(login.nombreU);
      if(usuarioValido && (await bcrypt.compare(login.contrasenha,usuarioValido.contrasenha))){
        return usuarioValido;
      }
      return null;
    }  
    getTokens(usuarioId:number,usuarioNom:string,usuarioRol:string,){
      const payload={
        sub: usuarioId,
        nombre: usuarioNom, 
        rol: usuarioRol,
      }
      console.log("payload")  
      console.log(payload);
      //creamos los tokens
      const accessToken=this.jwtService.sign(payload,{secret:'Pancho1', expiresIn:'1d'});
      const refreshToken=this.jwtService.sign(payload,{expiresIn:'1d'});
      //agregamos el refreshToken en una lista 
      this.refreshTokens.set(usuarioId,refreshToken);
      return { accessToken, refreshToken };
    }

    async refresh(resfreshToken:string){
      try{
        const payload=this.jwtService.verify(resfreshToken,{
          secret:'Pancho1',
        });
        const usuarioId=payload.sub;
        //comparamos con los guardados en memoria
        const tRegistrado=this.refreshTokens.get(usuarioId);
        if(tRegistrado!== resfreshToken) throw new UnauthorizedException('Token invalido');
        const nuevoRefreshToken=this.jwtService.sign({sub:usuarioId},{expiresIn:'1d'});
        const nuevoTokenAcceso=this.jwtService.sign({sub:usuarioId},{secret:'Pancho1',expiresIn:'1d'});
        this.refreshTokens.set(usuarioId,nuevoRefreshToken);
        return {accessToken:nuevoTokenAcceso,refreshToken:nuevoRefreshToken};
      }catch(e){ 
        throw new UnauthorizedException('Token expirado');
      }  
    }

    logout(u_id:number){
      this.refreshTokens.delete(u_id);
      console.log(this.refreshTokens);
    }
    
    async login(login:LoginDto) {
      const user=await this.usuarioService.buscarUsuarioPorNombre(login.nombreU);
      console.log(login.nombreU);
      if(!user || !(await bcrypt.compare(login.contrasenha,user.contrasenha))){
        throw new UnauthorizedException('Credenciales inválidas');
      }
      const payload ={
        sub:user.id,
        nombre:user.nombreU,
        rol:user.rol,
      }  
      return {
        access_token: this.jwtService.sign(payload),
      } 
    }
    //OTP=One-Time Password (Contraseña de un Solo Uso)
    async recuperarCuentaServ(email:string){  
      const correoValido =await this.usuarioService.buscarUsuariPorEmail(email);
      if(!correoValido){
        return { mensaje: 'Si el correo existe en nuestra DB, recibirás un código.'}
      }
      if(correoValido.estado!=='Activo')
        throw new UnauthorizedException('La cuenta ESI-Tech esta inactiva');

      const codigo=Math.floor(100000+Math.random()*900000).toString();
      const vigencia=Date.now()+5*60*1000;//expira en  5min
      try{
        await this.emailservice.enviarCodigoDeRecuperacion(email,codigo);
      }catch(error){
        console.error(`error enviando OTP a:${email}`, error)
        throw new InternalServerErrorException('No se puedo enviar el correo de recuperacion');
      }
      //*****Alerta:guardar en DB o en redis al llevar a produccion.
      this.codigosActivos.set(email,{codigo,expiraEn:vigencia,id:correoValido.id});
      return {
        mensaje: 'Si el correo existe en nuestra base, recibirás un código.'
      }
    }
    async VerificarCodigoServ( dto:NuevaContrasenhaDto){
      const memoriaCodigo=this.codigosActivos.get(dto.email);
      if(!memoriaCodigo) throw new BadRequestException('No has solicita ningun Codigo');
      if(memoriaCodigo.expiraEn<Date.now()) throw new BadRequestException('Tu codigo a expirado');
      if(memoriaCodigo.codigo!==dto.codigo) throw new BadRequestException('El codigo ingresado es invalido');
      //actuaizar
      const usuarioGuardado=await this.usuarioService.cambiarContrasenhaServ(dto.nuevaContrasenha,memoriaCodigo.id.toString())
      if(usuarioGuardado)this.codigosActivos.delete(dto.email);
      console.log(usuarioGuardado);
      return {mensaje: 'Tu contraseña a sido actualizada correctamente!!'}
    }
}
