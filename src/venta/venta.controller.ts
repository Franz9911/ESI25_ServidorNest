import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { VentaService } from './venta.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { FindVentaDto } from './dto/find-venta.dto';
import { AnularPagoDto } from 'src/finanzas/dto/anular-pago-cuota.dto';

@Controller('venta')
export class VentaController {
  constructor(private readonly ventaService: VentaService) {}

  @Post('registrar')
  create(@Body() dto: CreateVentaDto) {
    return this.ventaService.registrarVentaServ(dto);
  }

  @Get('lista')
  buscarVentas(
    @Query() dto:FindVentaDto
  ) {
    return this.ventaService.buscarVentasServ(dto);
  }

  
  @Get('detalle/:id')
  verVentaDetalle(@Param('id') id: string) {
    console.log('en ver ordencompra');
    const relaciones = ['detalles','detalles.producto.marca',
   'cliente.persona','cliente.empresa',
   'planPagos', 'planPagos.cuotas.pago', 
  ]
    return this.ventaService.verVentaDetalleServ(+id, relaciones);
  }
  @Patch('anular/:id')
  update(@Param('id') id: string, @Body() dto: AnularPagoDto) {
    return this.ventaService.anularVenta(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ventaService.remove(+id);
  }
}
