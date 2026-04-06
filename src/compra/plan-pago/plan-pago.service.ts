import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { UpdatePlanPagoCompraDto } from '../dto/update-plan-pago-compra.dto';
import { QueryRunner } from 'typeorm';
import { Compra } from '../entities/compra.entity';
import { PlanPagoCompra } from '../entities/plan-pago.entity';
import { CuotaCompra } from '../entities/cuota-compra.entity';
import { PagoCompra } from '../entities/pago-compra.entity';
import { EstadoCuota } from 'src/common/enums/estado-cuota.enum';
import { EstadoPlanPago } from 'src/common/enums/estado-plan-pago.enum';

@Injectable()
export class PlanPagoService {

    async registrarPlanPago(planDto:UpdatePlanPagoCompraDto,
        compra:Compra,queryRunner:QueryRunner):Promise<PlanPagoCompra>{
            if (planDto.numCuotas <= 0) {
                throw new BadRequestException('El número de cuotas debe ser mayor a 0');
            }
              
            if (planDto.montoTotalOperacion <= 0) {
                throw new BadRequestException('El monto total debe ser mayor a 0');
            }
            const plan=queryRunner.manager.create(PlanPagoCompra,{
                numCuotas: planDto.numCuotas,
                monedaOperacion: planDto.monedaOperacion,
                montoTotalML: planDto.montoTotalML,
                montoTotalOperacion: planDto.montoTotalOperacion,
                tipoCambio: planDto.tipoCambio,
                frecuencia: planDto.frecuencia,
                saldoPendienteML: planDto.montoTotalML,
                saldoPendiente: planDto.montoTotalOperacion,
                fechaInicio: planDto.fechaInicio,
                estado: EstadoPlanPago.ACTIVO,
                compra,
            }); 
            const planRegistrado= await queryRunner.manager.save(plan);
            const numCuotas= Number(plan.numCuotas);
            const frecuenciaDias=Number(plan.frecuencia);
            const montoBase=Math.floor(plan.montoTotalOperacion/numCuotas); //redondeo hacia abajo
            let resto= plan.montoTotalOperacion-montoBase*numCuotas; 
            for(let i=0;i<numCuotas;i++){
                const fechaPago= this.calcularFechaPago(plan.fechaInicio,i*frecuenciaDias);
                const monto= resto > 0 ? montoBase+1 : montoBase; //si resto > 0 entonces monto = montobase +1; caso contrario monto=montobase; 
                resto--;
                const cuota=queryRunner.manager.create(CuotaCompra,{
                    fechaPago,
                    numCuota:i+1,
                    estado:EstadoCuota.PENDIENTE,
                    monto,
                    plan:planRegistrado,
                });
                await queryRunner.manager.save(cuota);
            }
        return planRegistrado
    }  

    calcularFechaPago(fechaInicio:Date,dias:number):Date{
        const nuevaFecha=new Date(fechaInicio);
        nuevaFecha.setDate(nuevaFecha.getDate()+dias);
        //evitar domingos
        if(nuevaFecha.getDay()===0){
            nuevaFecha.setDate(nuevaFecha.getDate()+1)
        }
        return nuevaFecha; 
    }
    async marcarCuotaComoPagada(plan:PlanPagoCompra,
        cuota:CuotaCompra,pago:PagoCompra,queryRunner:QueryRunner):Promise<void>{
        
        cuota.estado=EstadoCuota.PAGADA;
        await queryRunner.manager.save(cuota);
        const cuotasPendientes=await queryRunner.manager.count(CuotaCompra,{
            where:{
                plan:{id:plan.id},
                estado:EstadoCuota.PENDIENTE,
            },
        }); 
        if(cuotasPendientes===0){
            plan.estado=EstadoPlanPago.COMPLETADO;
        }
        plan.saldoPendienteML-=pago.montoML;
        plan.saldoPendiente-=pago.montoOperacion;
        //Nota: si el numero en decimail typeORM lo transforma en cadena 
        plan.totalRecargoMora = Number(plan.totalRecargoMora ?? 0) + Number(pago.recargoMora ?? 0);
        await queryRunner.manager.save(plan);
    } 
    //NOTA: Estamos recibiendo el plan y sus cuotas
    async anularPlanPago(plan:PlanPagoCompra,queryRunner:QueryRunner):Promise<void>{
        plan.estado=EstadoPlanPago.ANULADO;
        await queryRunner.manager.save(plan); //plan anulado
        if(!plan.cuotas){
            throw new ConflictException('el plan de pagos no tiene cuotas');
        } 
        for(let c of plan.cuotas){
            if(c.estado === EstadoCuota.PENDIENTE){
                c.estado = EstadoCuota.ANULADA;
                await queryRunner.manager.save(c); //cuota anulada
            }
        }
    }

}
