import { Controller, Get,Req, Post, Body, Patch, Param, Delete, Query,UseGuards, Res, UnauthorizedException } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';
import { Usuario } from './entities/usuario.entity';
import { RolesGuard } from 'src/autenticacion/common/guards/roles.guardia';
import { Roles } from 'src/autenticacion/common/decorators/roles.decorador';
import { JwtAuthGuard } from 'src/autenticacion/common/guards/jwtAuthGuard';
import * as Busboy from 'busboy';
import { join } from 'path';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { Request } from 'express';
import { Readable } from 'stream';

@Controller('usuario/')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}
  
  @Post('registrar')
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    console.log("en el controler con ");
    console.log(createUsuarioDto);
    //return createUsuarioDto;
    return this.usuarioService.CrearUsuario(createUsuarioDto);
  }
  
  @Get('buscarUsuarioId/:id') 
  buscarUsuarioId(@Param('id') id: string) {
    console.log("entramos2")
    return this.usuarioService.buscarUsuarioId(+id);
  }

  //metodo para que administracion mantenga actualizados los datos de los usuarios.
  //entrada en Body: rol, estado. 
  @Patch('actualizarUsuario/:id')
  async actualizarUsuario(
    @Param('id') id: string, 
    @Body() updateUsuarioDto: UpdateUsuarioDto) {
      const usuarioActualizado= await this.usuarioService.actualizarUsuarioServ(+id, updateUsuarioDto);
      console.log("usuarioActualizado")
      console.log(usuarioActualizado);
      return usuarioActualizado;
  }
  //metodo para que un usuario actualiza su informacion de ususario. 
  //entrada formData: nombreU,contrasenhaActual, nuevaContrasenha, fotografia.  
  @UseGuards(JwtAuthGuard)
  @Patch('editarMiPerfil')
  async editarMiPerfil( //recibe los datos de un formData. 
    @Req() req: Request & Readable,){
    const userId = (req as any).user.id; // Aquí obtenemos el id del usuario autenticado
    console.log(userId);
    return new Promise((resolve, rejects)=>{
      const folderUsuario ="usuarios";
      const busboy=Busboy({headers:req.headers});
      const body:any={};
      let imagenRuta:string|null=null;
      console.log("ingresamos a editar mi perfil return")
      busboy.on('file',(filedname,file,info)=>{ //extraemos del formData la info de la imagen. 
        let {filename} = info; //del objeto info sacamos la propiedad filename y la guardamos en la const filename.
        const fecha = new Date().toISOString().split('T')[0]; // "2025-08-17"
        const partes = filename.split('.');
        const nombre = partes[0];      // "omunculo"
        const extension = partes[1]; 
        filename=nombre+fecha+"."+extension;
        console.log(JSON.stringify(info));
        const folderPath=join(__dirname,'..','..',folderUsuario);//definimos la direccion del archivo:"SERV-ESI/Ususarios". 
        console.log('Subiendo archivo:', folderPath);
        if(!existsSync(folderPath)){//si la direccion en folderPaht no existe.
          mkdirSync(folderPath,{recursive:true}); // se creara la direccion.
        }
        const savePath=join(folderPath,filename); //concatenamos la direccion  el nombre de archivo para guardar en db.
        file.pipe(createWriteStream(savePath));//guardamos la imagen  en la direccion de savePaht.
        imagenRuta=folderUsuario+"/"+filename;
        console.log('archivo guardado en: '+imagenRuta);
      });
      busboy.on('field',(fieldname,val)=>{ //extraemos y guardamos los datos de formData en body. 
        body[fieldname]=val; //fieldname: nombre del campo, val: valor del campo  
      });//todos los datos son extraidos seran tomados como string.
      busboy.on('finish', async () => { //al terminar la lectura de los datos del formData se accede a esta seccion del codigo.
        try{
          const datosActualizados= await this.usuarioService.editarMiPerfilServ(
            {...body,fotografia:imagenRuta},userId
          );
          console.log(body);
          resolve(datosActualizados);//si todo sale bien. resolvemos la promesa  
        }catch(error){
          rejects(error); //si sale mal. informamos del error 
        }  
      });
    //A partir de aquí, Busboy irá disparando on('file'), on('field') y al final on('finish').
    (req as Readable).pipe(busboy); //conectamos el flujo de datos que viene de req al parser busboy.
    });  
  }

  @Delete('Eliminar/:id/:ci')
  eliminarUsuario(
    @Param('id') id: string,
    @Param('ci') ci: string) {
    return this.usuarioService.EliminarUsuarioServ(+id,+ci); 
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('listar')
  BuscarTodosLosUsuarios( 
    @Query('id') id?: string, //@Query permite que los parametros de Busqueda puedan ser nulos y usar solo los enviados 
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('nombre') nombre?: string,
    @Query('apellidos') apellidos?:string,
    @Query('estado') estado?: string,
    @Query('rol') rol?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise< PaginacionResultado<Usuario>> {
    return this.usuarioService.BuscarTodosLosUsuariosSer2(
      nombre,apellidos,estado,rol,fechaInicio,fechaFin,+page,+limit)
  } 

}