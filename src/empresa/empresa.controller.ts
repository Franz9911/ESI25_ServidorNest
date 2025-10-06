import { Controller, Get, Post, Body,Req, Patch, Param, Delete, Query } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

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
    console.log('filtros',filtros);
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

  @Get('representantes')
  buscarEmpresaPorId(@Query('id') id: string) {
    return this.empresaService.buscarEmpresaPorId(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmpresaDto: UpdateEmpresaDto) {
    return this.empresaService.update(+id, updateEmpresaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.empresaService.remove(+id);
  }
}
