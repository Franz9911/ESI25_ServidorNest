import { Controller, Get, Post,Req, Body, Patch, Param, Delete, Query,UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';
import { Usuario } from './entities/usuario.entity';
import { RolesGuard } from 'src/autenticacion/common/guards/roles.guardia';
import { Roles } from 'src/autenticacion/common/decorators/roles.decorador';
import { JwtAuthGuard } from 'src/autenticacion/common/guards/jwtAuthGuard';

@Controller('usuario/')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}
  
@UseGuards(JwtAuthGuard)
@Get('protegido')
protegido(@Req() req) {
  console.log('Entrando a ruta protegida');
  return { mensaje: 'Acceso permitido', user: req.user };
}
  

  @Post('registrar')
  create(@Body() createUsuarioDto: any) {
    
    console.log("en el controler con ");
    console.log(createUsuarioDto);
    //return createUsuarioDto;
    return this.usuarioService.CrearUsuario(createUsuarioDto);
  }

  @Get('usuarios')
  BuscarTodosLosUsuariosCon(
  ) {
    return this.usuarioService.BuscarTodosLosUsuariosSer();
  } 
  @Get('id/:id') 
  findOne(@Param('id') id: string) {
    return this.usuarioService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuarioService.update(+id, updateUsuarioDto);
  }

  @Delete('Eliminar/:id/:ci/:personaId')
  eliminarUsuario(
    @Param('id') id: string,
    @Param('ci') ci: string,
    @Param('personaId') personaId: string) {
      console.log(+personaId);
    return this.usuarioService.EliminarUsuarioyPersonaServ(+id,+ci,+personaId); 
  }
  @UseGuards(JwtAuthGuard)
  @Get('listar')
  findAllClientes(
    @Query('id') id?: string,
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
    //{id, fechaRegistro, nombre};
  } 

}
