import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MovimientosFinancierosService } from './movimientos-financieros.service';
import { CreateMovimientosFinancieroDto } from './dto/create-movimientos-financiero.dto';
import { UpdateMovimientosFinancieroDto } from './dto/update-movimientos-financiero.dto';

@Controller('movimientos-financieros')
export class MovimientosFinancierosController {
  constructor(private readonly movimientosFinancierosService: MovimientosFinancierosService) {}

  @Post()
  create(@Body() createMovimientosFinancieroDto: CreateMovimientosFinancieroDto) {
    return this.movimientosFinancierosService.create(createMovimientosFinancieroDto);
  }

  @Get()
  findAll() {
    return this.movimientosFinancierosService.findAll();
  }



 
}
