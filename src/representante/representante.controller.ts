import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RepresentanteService } from './representante.service';
import { CreateRepresentanteDto } from './dto/create-representante.dto';
import { UpdateRepresentanteDto } from './dto/update-representante.dto';

@Controller('representante')
export class RepresentanteController {
  constructor(private readonly representanteService: RepresentanteService) {}

  @Post('registrar')
  create(@Body() dto: CreateRepresentanteDto) {
    console.log(dto);
    return this.representanteService.create(dto);
  }

  @Get()
  findAll() {
    return this.representanteService.findAll();
  }

  @Get(':id')
  representantesPorEmpresa(@Param('id') id: string) {
    return this.representanteService.representantesPorEmpresa(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRepresentanteDto: UpdateRepresentanteDto) {
    return this.representanteService.update(+id, updateRepresentanteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.representanteService.remove(+id);
  }
}
