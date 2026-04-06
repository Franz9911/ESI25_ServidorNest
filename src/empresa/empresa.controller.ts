import { Controller, Get, Post, Body,Req, Patch, Param, Delete,
   Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { JwtAuthGuard } from 'src/autenticacion/common/guards/jwtAuthGuard';
import { Request } from 'express'; 
import { Readable } from 'stream';
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post('registrar')
  crearEmpresa(
    @Body() createEmpresaDto: CreateEmpresaDto,
    @Req() req:any) {
      console.log('ingresamos en contrler empresa');
      //const usuarioId=req.user;
      //console.log('id usuario responsable',usuarioId);
    return this.empresaService.crearEmpresaServ(createEmpresaDto);
  }

  @Get('listar')
  async buscarEmpresas(@Query() filtros:any) {
    console.log('filtros2',filtros);
    return await this.empresaService.buscarEmpresasServ(filtros);
  }

  @Get('SinProveedor')
  async buscarEmpresasSinProveedor(
    @Query('razonSocial') razonSocial?:string,
    @Query('nit') nit?:string,
    @Query('datosPorPagina') datosPorPagina?:string,
    @Query('paginaActual') paginaActual?:string
    ){
    console.log("ingresamos");
    return await this.empresaService.EmpresasSinProveedorServ(razonSocial,nit,datosPorPagina,paginaActual);
  }

  //buscar empresa , repersesntantes, cuentas bancarias
  @Get('representantes')
  buscarEmpresaPorId(@Query('id') id: string) {
    return this.empresaService.buscarEmpresaPorId(+id);
  }
  @UseGuards(JwtAuthGuard)
  @Patch('modificar/:id')
  ModifcarEmpresa(
    @Param('id') id: string, 
    @Req() req: Request & Readable,
    @Body() updateEmpresaDto: UpdateEmpresaDto) {
     //const usuarioId= (req as any);
     const p=(req as any ).user.id;
     console.log(p);
    //console.log(req);
    return this.empresaService.ModifcarEmpresaServ(+id, updateEmpresaDto,p);
  }

  @Delete('eliminar/:id')
  EliminarEmpresa(@Param('id') id: string) {
    return this.empresaService.EliminarEmpresaServ(+id);
  }
}
