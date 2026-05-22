import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { FindClienteDto } from './dto/find-cliente.dto';

@Controller('cliente')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Post('registrar')
  crearCliente(@Body() dto: CreateClienteDto) {
    console.log(dto);
    
    return this.clienteService.create(dto);
  }

  @Get('listar')
  findAll(@Query() dto:FindClienteDto) {
    console.log(dto)
    return this.clienteService.buscarClientes(dto);
  }



  @Patch('modificar/:id')
  update(@Param('id') id: string, 
  @Body() updateClienteDto: UpdateClienteDto) {
    console.log('en el servidorController')
    return this.clienteService.modificarClienteServ(+id, updateClienteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clienteService.eliminarCliente(+id);
  }
}
