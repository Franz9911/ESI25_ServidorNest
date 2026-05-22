import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';
import { CreateMovimientoInventarioDto } from './dto/create-movimiento-inventario.dto';

@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Post('ingreso')
  create(@Body() dto: CreateMovimientoInventarioDto) {
    return this.inventarioService.registrarIngreso(dto);
  }

  @Get()
  findAll() {
    return this.inventarioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventarioService.findOne(+id);
  }


}
