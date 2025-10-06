import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProveedorService } from './proveedor.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { FindProveedorDto } from './dto/find-proveedor.dto';

@Controller('proveedor')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post('registrar')
  crearProveedorServ(@Body() createProveedorDto: CreateProveedorDto) {
    console.log(createProveedorDto);
    return this.proveedorService.crearProveedorServ(createProveedorDto);
  }

  @Get('listar')
  BuscarProveedores(@Query()dto:FindProveedorDto) {
    console.log('dtoo',dto)
    return this.proveedorService.buscarEmpresaProveedorServ(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proveedorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProveedorDto: UpdateProveedorDto) {
    return this.proveedorService.update(+id, updateProveedorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.proveedorService.remove(+id);
  }
}
