import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UnauthorizedException } from '@nestjs/common';
import { MarcaService } from './marca.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { buscarMarcaDto } from './dto/buscar-marca.dto';

@Controller('marca')
export class MarcaController {
  constructor(private readonly marcaService: MarcaService) {}

  @Post('registrarMarca')
  crearMarca(@Body() createMarcaDto: CreateMarcaDto) {
    return this.marcaService.crearMarcaSer(createMarcaDto);
  }

  @Get('buscarMarcas')
  buscarMarcaPorNombre(
    @Query() filtros:buscarMarcaDto) {
      if(!filtros.limit || !filtros.page){
        return new UnauthorizedException('Consulta invalida');
      }
    return this.marcaService.buscarMarcaPorNombreSer(filtros);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marcaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMarcaDto: UpdateMarcaDto) {
    return this.marcaService.update(+id, updateMarcaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marcaService.remove(+id);
  }
}
