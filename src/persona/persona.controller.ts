import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PersonaService } from './persona.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';
import { Persona } from './entities/persona.entity';

@Controller('persona')
export class PersonaController {
  constructor(private readonly personaService: PersonaService) {}

  @Post('registraPersona')
  async create(@Body() createPersonaDto: CreatePersonaDto) {
    console.log("ingresamos a controler")
     const res=await this.personaService.create(createPersonaDto);
    console.log(res);
    return res;
  }

  @Get('listar')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ):Promise<PaginacionResultado<Persona>> {
    console.log("prueba")
    return this.personaService.findAll(+page,+limit);
  }

  @Get('buscarPersonasSinUsuario')
  buscarSinU(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('nombre') nombre?: string,
    @Query('apellidos') apellidos?:string,
  ):Promise<PaginacionResultado<Persona>> {
    console.log("en el cont")
     return this.personaService.buscarPersonasSinUsuario(nombre,apellidos,+page,+limit);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personaService.findOne(+id);
  }


  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePersonaDto: UpdatePersonaDto) {
    return this.personaService.update(+id, updatePersonaDto);
  }

  @Delete('Eliminar/:id')
  remove(@Param('id') id: string) {
    return this.personaService.remove(+id);
  }
}
