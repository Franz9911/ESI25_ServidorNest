import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cuota } from 'src/cuentas/entities/cuota.entity';
import { PlanPago } from 'src/cuentas/entities/planPago.entity';
import { QueryRunner } from 'typeorm';
import { Pago } from '../entities/pago.entity';
import { EstadoPago } from 'src/common/enums/estado-pago.enum';
import { CreatePagoDto } from '../dto/create-pago.dto';
import { AnularPagoDto } from '../dto/anular-pago-cuota.dto';

@Injectable()
export class PagoService {
    public async registrarpagoAlContado(cuota:Cuota,concepto:string, plan:PlanPago, queryRunner:QueryRunner){
      console.log('planpago');
      const tipoCambio :number=plan.tipoCambio ?? 1;
      const pago = queryRunner.manager.create(Pago,{
        tipoCambio,
        monedaOperacion:plan.moneda,
        montoOperacion:cuota.monto,
        montoML:Number((cuota.monto*tipoCambio).toFixed(2)),
        estado:EstadoPago.REGISTRADO,
        concepto,
        cuota,
        planPago:plan,
      });
      const pagoRegistrado =await queryRunner.manager.save(pago);
      return pagoRegistrado;
    }

    public async registrarPagoDeCuota(plan:PlanPago, cuota:Cuota, dto:CreatePagoDto, queryRunner:QueryRunner){
        if(!dto.movimientosF.length){
          throw new BadRequestException('Debes agregar movimientos financieros en el pago');
        }
        const tipoCambio:number=dto.tipoCambio ?? 1;
        const recargoMora:number=dto.recargoMora ?? 0;
        const montoEsperado:number=dto.montoOperacion+recargoMora;
        console.log("pagoDTo en pagoservice",montoEsperado);
        //la suma de los moviminetos debe ser igual a montoesperado; 
        const pago =  queryRunner.manager.create(Pago,{
            estado:EstadoPago.REGISTRADO,
            concepto:`pago de cuota ${cuota.id} del plan de pago ${plan.id}`,
            fechaPago:new Date,
            monedaOperacion:plan.moneda,
            montoML:Number((montoEsperado*tipoCambio).toFixed(2)),
            //el total de los movimientos debe ser igual a montoML de cuota
            montoOperacion:montoEsperado, 
            tipoCambio,
            recargoMora,
            planPago:plan,
            cuota,
        });
        return  await queryRunner.manager.save(pago);
    }

  //revertir todos los pagos de una compra o venta anulada
  async revercionTotalPagos(pagos:Pago[], motivo:AnularPagoDto, queryRunner:QueryRunner){  
    console.log("pago service");
    if(pagos.length===0){
      return;
    }
    for(const p of pagos){
      if(!p.fechaAnulacion){
        p.estado=EstadoPago.ANULADO;
        p.motivoAnulacion=motivo.motivo;
        p.fechaAnulacion=new Date();
      }else{
        console.log(`pago ya esta anulado`,p );
      }
    }
    await queryRunner.manager.save(pagos);
  }
  //anular pago unico
  async anularPago(idPago:number,dto:AnularPagoDto, queryRunner:QueryRunner){
    const pago:Pago =await queryRunner.manager.findOne(Pago,{
      where:{ id:idPago,
      estado:EstadoPago.REGISTRADO,
      },
      lock:{mode:'pessimistic_write'}
    });
    console.log("pago; " ,pago);
    if(!pago){
      throw new NotFoundException('Pago no encontrado');
    }
    if(pago.estado === EstadoPago.ANULADO){
      throw new BadRequestException('El pago ya fue anulado');
    }
    const pagoAux =await queryRunner.manager.findOne(Pago,{
      where:{ id:idPago },
      relations:['planPago', 'cuota','movimientos'],
    });
    const ultimoPago = await queryRunner.manager.findOne(Pago,{
      where:{
        planPago:{id:pagoAux.planPago.id},
        estado:EstadoPago.REGISTRADO
      },
      order:{
        fechaPago:'DESC',
          id:'DESC'
      }
    });

    if(!ultimoPago || ultimoPago.id !== pago.id){
        throw new BadRequestException('Solo puede anular el ultimo pago registrado');
    }
    pago.estado=EstadoPago.ANULADO;
    pago.fechaAnulacion=new Date();
    pago.motivoAnulacion=dto.motivo;
    await queryRunner.manager.save(pago);
    return pagoAux;
  }
}
