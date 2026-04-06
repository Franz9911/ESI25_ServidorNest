import { Controller,UseGuards, Req, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PersonaService } from './persona.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';
import { Persona } from './entities/persona.entity';
import { Readable } from 'stream';
import { JwtAuthGuard } from 'src/autenticacion/common/guards/jwtAuthGuard'; 
import { FindPersonaDto } from './dto/find-persona.dto';

@Controller('persona')
export class PersonaController {
  constructor(private readonly personaService: PersonaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('registraPersona')
  async create(@Body() createPersonaDto: CreatePersonaDto,
  @Req()req:Request & Readable,) {
    const usuarioResponsableId:number=(req as any).user.id;
    console.log("ingresamos a controler",createPersonaDto);
    console.log(usuarioResponsableId);
    const res=await this.personaService.create(createPersonaDto, usuarioResponsableId);
    console.log(res);
    return res;
  }

  @Get('listar')
  findAll(
    @Query() dto:FindPersonaDto,
    
  ):Promise<PaginacionResultado<Persona>> {
    return this.personaService.findAll(dto);
  }

  @Get('buscarPersonasSinUsuario')
  buscarSinU(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('nombre') nombre?: string,
    @Query('apellidos') apellidos?:string,
  ):Promise<PaginacionResultado<Persona>> {
     return this.personaService.buscarPersonasSinUsuario(nombre,apellidos,+page,+limit);
  }
  
  @Get('buscarId')
  BuscarPorId(@Query('id') id: string) {
    return this.personaService.buscarPorId(+id);
  }


  @Patch('modificar/:id')
  async update(@Param('id') id: string, 
  @Body() dto: UpdatePersonaDto) {
    return await this.personaService.update(+id, dto);
  }

  @Delete('Eliminar/:id')
  remove(@Param('id') id: string) {
    return this.personaService.remove(+id);
  }
}
