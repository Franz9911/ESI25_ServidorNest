import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CuentasService } from './cuentas.service';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { UpdateCuentaDto } from './dto/update-cuenta.dto';
import { CreatePagoDto } from 'src/finanzas/dto/create-pago.dto';
import { AnularPagoDto } from 'src/finanzas/dto/anular-pago-cuota.dto';

@Controller('cuentas')
export class CuentasController {
  constructor(
    private readonly cuentasService: CuentasService,
  ){}

  @Post('pago/credito')
  async registrarPagoCredito(
    @Body() dto:CreatePagoDto,
  ){
    return await this.cuentasService.registrarPagoDeCuota(dto);
  }
  
  @Get('pago/:id')
  findOne(@Param('id') id: string) {
    console.log('vercuota', id );
    return this.cuentasService.buscarCuotaPago(+id);
  }

  @Patch('anular/pago/:id')
  anularPago(@Param('id') id: string, @Body() dto: AnularPagoDto) {
    console.log("ingresamos a anular pago: ", id);
    return this.cuentasService.anularPagoServ(+id, dto);
  }

}
