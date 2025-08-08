import { Injectable, UnauthorizedException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from 'src/usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt  from 'bcrypt';
import { Usuario } from 'src/usuario/entities/usuario.entity';



@Injectable()
export class AutenticacionService {
  private refreshTokens=new Map<number,string>();
    constructor(
        private usuarioService:UsuarioService,
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
    getTokens(usuarioId:number,usuarioNom:string,usuarioRol:string){
      const payload={
        sub: usuarioId,
        nombre: usuarioNom, 
        rol: usuarioRol
      }
      console.log("payload")  
      console.log(payload);
      //creamos los tokens
      const accessToken=this.jwtService.sign(payload,{secret:'Pancho1', expiresIn:'15m'});
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
        const nuevoTokenAcceso=this.jwtService.sign({sub:usuarioId},{secret:'Pancho1',expiresIn:'15m'});
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
}
