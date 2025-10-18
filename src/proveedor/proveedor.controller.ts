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

  @Get('detalle')
  findOne(@Query('id') id: string) {
    return this.proveedorService.buscarProveedorPorId(+id);
  }

  @Patch('modificar/:id')
  ModifcarProveedor(
    @Param('id') id: string, 
    @Body() dto: UpdateProveedorDto) {
    return this.proveedorService.ModifcarProveedorServ(+id, dto);
  }

  @Delete('eliminar/:id')
  EliminarProveedor(@Param('id') id: string) {
    return this.proveedorService.EliminarProveedorServ(+id);
  }
}
