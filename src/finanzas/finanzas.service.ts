import { BadRequestException, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { Cuota } from 'src/cuentas/entities/cuota.entity';
import { PlanPago } from 'src/cuentas/entities/planPago.entity';
import { DataSource, QueryRunner } from 'typeorm';
import { PagoService } from './pago/pago.service';
import { CreateMovimientoFinancieroDto2 } from './dto/movimiento-financiero.dto';
import { Pago } from './entities/pago.entity';
import { MovimientoFinanciero } from './entities/movimiento-financiero.entity';
import { MovimientoFinancieroService } from './movimiento-financiero/movimiento-financiero.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { EstadoPago } from 'src/common/enums/estado-pago.enum';
import { AnularPagoDto } from './dto/anular-pago-cuota.dto';
import { async } from 'rxjs';
@Injectable()
export class FinanzasService {
    constructor(
        private readonly pagoService:PagoService,
        private readonly movimientoFService:MovimientoFinancieroService,
    ){}
    public async registrarPagoAlContado( planPago:PlanPago,concepto:string, queryRunner: QueryRunner,movimientos:CreateMovimientoFinancieroDto2[], cuota:Cuota){
        if(!movimientos?.length){
            throw new BadRequestException('Debe agregar moviminetos financieros');
        }
        //el pago registra en moneda local y moneda de operacion y el tipo de cambio;
        //realiza la comvercion mediante el tipo de cambio 
        const pago = await this.pagoService.registrarpagoAlContado(cuota,concepto, planPago, queryRunner);
        //registrar movimientos 
        await this.movimientoFService.registrarMovimientos(pago, movimientos, queryRunner);
        //emitir factura    
        return pago;
    }
    //para venta el valort que manda es montoML
    public async registrarPagoDeCuota(plan:PlanPago,cuota:Cuota, dto:CreatePagoDto, queryRunner:QueryRunner){
        const pago= await this.pagoService.registrarPagoDeCuota(plan, cuota, dto, queryRunner);
        await this.movimientoFService.registrarMovimientos(pago,dto.movimientosF,queryRunner);
        return pago;
    }
    //anular un pago unico y sus mov financieros 
    public async anularPagoMovimientos(idPago:number, dto:AnularPagoDto, queryRunner:QueryRunner){
        console.log("id pago ",idPago)
        const pago= await this.pagoService.anularPago(idPago,dto, queryRunner);

        const movimentos= pago.movimientos;
        if(movimentos.length===0){
            throw new NotFoundException('No se pudo encontrar los moviminetos financieros del pago');
        }
        await this.movimientoFService.revertirMovimientosFinancieros(movimentos, pago, queryRunner);

        return pago;
    } 
    // revertir todos los pagos de un plan
    async reversarPagosPlan(idPlan:number, motivo:AnularPagoDto, queryRunner:QueryRunner){
      const pagos = await queryRunner.manager.find(Pago,{
        where:{planPago:{ id:idPlan }},
        lock:{mode:'pessimistic_write'}
      });
      if(pagos.length===0){
        return;
      }
      await this.movimientoFService.revertirMovimientosTotal(pagos, queryRunner);
      await this.pagoService.revercionTotalPagos(pagos,motivo, queryRunner);
    }
}
