import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RegistroActividadService } from './registro-actividad.service';
import { CreateRegistroActividadDto } from './dto/create-registro-actividad.dto';
import { UpdateRegistroActividadDto } from './dto/update-registro-actividad.dto';

@Controller('registro-actividad')
export class RegistroActividadController {
  constructor(private readonly registroActividadService: RegistroActividadService) {}

  @Post()
  create(@Body() createRegistroActividadDto: CreateRegistroActividadDto) {
    return this.registroActividadService.create(createRegistroActividadDto);
  }

  @Get()
  findAll() {
    return this.registroActividadService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registroActividadService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRegistroActividadDto: UpdateRegistroActividadDto) {
    return this.registroActividadService.update(+id, updateRegistroActividadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registroActividadService.remove(+id);
  }
}
