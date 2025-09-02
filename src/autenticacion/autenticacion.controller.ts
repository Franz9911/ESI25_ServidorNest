import { Body, Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AutenticacionService } from './autenticacion.service';
import { LoginDto } from './dto/login.dto';
import { Response,Request } from 'express';
import { Throttle } from '@nestjs/throttler';
@Controller('autenticacion')
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}
  @Throttle({ default: { limit: 3, ttl: 60000 } })  //3 peticiones por minuto
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({passthrough:true}) res:Response,//perite modificar la respuesta para agrega cookies o headers.
    //{passthrough:true} perite que nest se encarge de gestinar la respuesta que modificamos.
    @Req() req: Request){
      console.log(loginDto);
      const usuarioAux=await this.autenticacionService.validarUsuario(loginDto);
      console.log("usuarioAux: " +usuarioAux);
      if(!usuarioAux) throw new UnauthorizedException('credenciales invalidas!')
      if(usuarioAux.estado==="Inactivo") throw new UnauthorizedException('estado incativo');
      const {accessToken,refreshToken}=this.autenticacionService.getTokens(usuarioAux.id,usuarioAux.nombreU,usuarioAux.rol) //solicitmos la creacion de refresh y accessToken
      const u_id=usuarioAux.id; 
      const u_r=usuarioAux.rol; 
      const fotografia=usuarioAux.fotografia;
      console.log("imprimiendo el refrestoken")
      console.log(refreshToken);
      //agregamos al access_token dentro de la cookie  dentro del res.
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: false, // true si estás en HTTPS
        sameSite: 'lax',
        path: '/',
        maxAge: 2* 60 * 60 * 1000, // 2 roras
      });
      //lagregamos el refreshToken dentro de la cookie de la respuesta.
      res.cookie('refreshToken',refreshToken,{ 
        httpOnly:true,
        secure:false,
        sameSite:'lax', //
        path:'/',
        maxAge:7*24*60*60*1000,

      });
      console.log("el ultimo return") 
      return {u_id,u_r,fotografia,mensaje:'ingreso exitoso!!'}
  
    }

    @Post('refresh')
    async refreshToken(@Req()req:Request,
    @Res({passthrough:true})res:Response,){
      const refreshToken=req.cookies['refreshToken'];
      console.log(refreshToken);
      if(!refreshToken){
        throw new UnauthorizedException('Datos faltantes');
      } 
      const {accessToken,refreshToken:nuevoRefreshToken}=await this.autenticacionService.refresh(refreshToken);
      res.cookie('refreshToken',nuevoRefreshToken,{
        httpOnly:true,
        secure:false,
        sameSite:'lax',
        path:'/',
        maxAge:1*24*60*60*1000 //1dia de duracion
      });
      return {accessToken};
    }

    @Post('logout')
    logout(
      @Body() id:number,
      @Req()req:Request,
      @Res({passthrough:true})res:Response){
        console.log('en el serv cerrado sesion');
        const u_id=req.body.id;
        this.autenticacionService.logout(u_id);
        //boramos las cookies.
        res.clearCookie('refreshToken', {
          httpOnly: true,
          sameSite: 'lax',
          secure: false, // true en producción
        });
        res.clearCookie('access_token',{
         httpOnly:true,
         sameSite:'lax',
         secure:false, 
        })
        return { message: 'Cierre de sesión exitoso' };
    }   
}
