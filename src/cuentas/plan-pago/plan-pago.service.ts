import { BadRequestException, Injectable } from '@nestjs/common';
import { Venta } from 'src/venta/entities/venta.entity';
import { QueryRunner } from 'typeorm';
import { PlanPago } from '../entities/planPago.entity';
import { EstadoPlanPago } from 'src/common/enums/estado-plan-pago.enum';
import { CreatePlanPagoDto } from '../dto/create-plan-pago.dto';
import { Compra } from 'src/compra/entities/compra.entity';

@Injectable()
export class PlanPagoService {
  //plan pago registra en mooneda local y moneda de operacion:
  //registra: total de la operacion , saldo , tipo de cambio y mora ,anticipo no se usa 
  public async registrarPlanPago(dto: CreatePlanPagoDto, entidad: Venta|Compra, queryRunner: QueryRunner) {
    let ventaAux: Venta=null;
    let compraAux: Compra=null 
    if (entidad instanceof Venta) {
      ventaAux = entidad;
      compraAux = null;
    } else if (entidad instanceof Compra) {
      compraAux = entidad;
      ventaAux = null;
    }
    const esCredito = entidad.tipo === 'credito';
    const montoBase = Number(dto.montoTotal);
    const interes = dto.interes ?? 0;
    const tipoCambio: number= dto.tipoCambio ?? 1;
    const anticipo = dto.anticipo ?? 0;
    if (montoBase <= 0) {
      throw new BadRequestException('El monto total debe ser mayor a 0');
    }
    if (anticipo < 0) {
      throw new BadRequestException('El anticipo no puede ser negativo');
    }
    if (anticipo > montoBase && !esCredito) {
      throw new BadRequestException('El anticipo no puede ser mayor al total');
    }
    
    let montoTotalFinal: number;
    let saldoPendiente: number;
    let estado: EstadoPlanPago;
    let numCuotas: number;

    if (!esCredito){ //al contado
      if (interes !== 0){
        throw new BadRequestException('Ventas al contado no deben tener interés');
      }
      montoTotalFinal = montoBase;
      saldoPendiente = 0;
      estado = EstadoPlanPago.COMPLETADO;
      numCuotas = 1;
    } else {
      if (interes < 0) {
        throw new BadRequestException('El interés debe ser mayor o igual a 0');
      }
      if (!dto.numCuotas || dto.numCuotas <= 0) {
        throw new BadRequestException('Debe definir el número de cuotas');
      }
      montoTotalFinal=Number( (montoBase *((interes/100)+1)).toFixed(2));
      saldoPendiente= montoTotalFinal -anticipo;
      estado =
        saldoPendiente <= 0 ? EstadoPlanPago.COMPLETADO : EstadoPlanPago.ACTIVO;
      numCuotas = dto.numCuotas;
    }
    //console.log('frecuencia_dto', dto.frecuencia);
    const plan = queryRunner.manager.create(PlanPago, {
      venta: ventaAux,
      compra:compraAux,
      fechaInicio: dto.fechaInicio,      
      estado,
      numCuotas,
      frecuencia: esCredito ? (dto.frecuencia ?? null) : null,
      moneda: dto.moneda, //ventas siempre BOB
      tipoCambio: tipoCambio,
      montoTotal: montoTotalFinal,
      saldoPendiente,
      //moneda local es aplicado en compras. por que la empresa no define la moneda en una compra 
      montoTotalML: montoTotalFinal*tipoCambio,
      saldoPendienteML: saldoPendiente*tipoCambio,
      interes: esCredito ? interes : null,
      //solo compras debe registra mora en formulario
      mora: esCredito ? (dto.mora ?? 0.02) : null,
      tipoMora: esCredito ? (dto.frecuencia ?? null) : null, //definir segun el tipo de frecuencia
      anticipo: esCredito ? anticipo : 0,
      totalRecargoMora: 0,
    });
    console.log(plan);
    return await queryRunner.manager.save(plan);
  }
  public async buscarPlanPagoVenta(idPlan:number,queryRunner:QueryRunner){
    //siempre usar lock primero el plan y luego en cuota para evitar un bloqueo mutuo con otra operaciones
    return await queryRunner.manager.findOne(PlanPago,{
      where:{
        id:idPlan,
      },
      lock:{mode:'pessimistic_write'}
    })
  }
  //usado al registrar el pago de una cuota
  public async actualizarPlan(planPago:PlanPago, monto:number,recargoMora:number, tipoCambio:number, queryRunner:QueryRunner){
    if (monto > planPago.saldoPendiente) {
      throw new BadRequestException(`El pago excede el saldo en el plan de pago`);
    }
    console.log("monto ",monto)
    planPago.saldoPendiente-=Number(monto)
    planPago.saldoPendienteML-=Number((monto*tipoCambio).toFixed(2));
    planPago.totalRecargoMora+=recargoMora;
    if(planPago.saldoPendiente<=0){
      planPago.estado=EstadoPlanPago.COMPLETADO;   
    }
    await queryRunner.manager.save(planPago); 
  }
  //sado al anular una compra? o venta
  public async revertirEfectoPagoCuota(id,queryRunner, pagoAux){
    const plan= await this.buscarPlanPagoVenta(id,queryRunner);
    plan.saldoPendiente =Number(plan.saldoPendiente)+ Number(pagoAux.montoOperacion);
    plan.saldoPendienteML=Number(plan.saldoPendienteML)+Number(pagoAux.montoML);
    plan.estado=EstadoPlanPago.ACTIVO;
    await queryRunner.manager.save(plan);
  }
  
}
