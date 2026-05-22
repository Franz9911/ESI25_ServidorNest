import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { UpdateCuentaDto } from './dto/update-cuenta.dto';
import { PlanPagoService } from './plan-pago/plan-pago.service';
import { Venta } from 'src/venta/entities/venta.entity';
import { DataSource, QueryRunner } from 'typeorm';
import { CuotaService } from './cuota/cuota.service';
import { PlanPago } from './entities/planPago.entity';
import { FinanzasService } from 'src/finanzas/finanzas.service';
import { CreateMovimientoFinancieroDto2 } from 'src/finanzas/dto/movimiento-financiero.dto';
import { CreatePagoDto } from 'src/finanzas/dto/create-pago.dto';
import { EstadoPlanPago } from 'src/common/enums/estado-plan-pago.enum';
import { EstadoCuota } from 'src/common/enums/estado-cuota.enum';
import { Compra } from 'src/compra/entities/compra.entity';
import { CreatePlanPagoDto } from './dto/create-plan-pago.dto';
import { AnularPagoDto } from 'src/finanzas/dto/anular-pago-cuota.dto';
import { Pago } from 'src/finanzas/entities/pago.entity';
import { EstadoPago } from 'src/common/enums/estado-pago.enum';
import { MovimientoFinanciero } from 'src/finanzas/entities/movimiento-financiero.entity';
import { Cuota } from './entities/cuota.entity';
import { TipoMovimientoFinanciero } from 'src/common/enums/tipo-movimento-financiero.enum';

@Injectable()
export class CuentasService {

  constructor(
    private readonly dataSource: DataSource,
    private readonly planPagoService: PlanPagoService,
    private readonly coutaService: CuotaService,
    private readonly finanzasService: FinanzasService,
    ) {}

  async crearPlanPagoVenta(dto, entidad:Venta|Compra, queryRunner:QueryRunner, movimientos?:CreateMovimientoFinancieroDto2[]) {
    const plan= await this.planPagoService.registrarPlanPago(dto, entidad, queryRunner);
    //Registrar las cuotas y pago en caso de venta al contado
    if(entidad.tipo==="contado"){
      const cuota = await this.coutaService.crearCoutaAlContado(plan, queryRunner);
      //ir a finanzas 
      const concepto="venta de productos electronicos";
      const pago= await this.finanzasService.registrarPagoAlContado(plan,concepto, queryRunner, movimientos, cuota);
    }else{
      const cuotas= await this.coutaService.crearCuotasCredito(plan,dto.numCuotas,queryRunner);
    }
    
    return plan;
  }

   
  async crearPlanPagoCompra(dto:CreatePlanPagoDto, entidad:Compra, queryRunner:QueryRunner, movimientos?:CreateMovimientoFinancieroDto2[] ){
    console.log('en cuentas service pago compra');
    //plan pago registra en mooneda local y moneda de operacion:
    //solo registra los: totales , pendientes , tipo de cambio de la operacion y mora 
    const plan= await this.planPagoService.registrarPlanPago(dto, entidad, queryRunner);
    if(entidad.tipo==="al contado"){
      //cuota al contado registra solo en moneda de operacion 
      const concepto="compra de mercaderia";
      const cuota = await this.coutaService.crearCoutaAlContado(plan, queryRunner);
      const pago= await this.finanzasService.registrarPagoAlContado(plan,concepto, queryRunner, movimientos, cuota);
      console.log("pago Registrado: ",pago)
    }else{
      const cuota = await this.coutaService.crearCuotasCredito(plan,dto.numCuotas, queryRunner,);
    }
    return plan;
  }
  public async registrarPagoDeCuota(dto:CreatePagoDto){
    console.log("registra pago de cuota en servidor ")
    const tipoCambio:number= dto.tipoCambio ?? 1;
    const queryRunner= this.dataSource.createQueryRunner(); 
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
        if(!dto.movimientosF?.length){
          throw new BadRequestException('Debes agregar moviminetos financieros al pago');
        }
        const plan= await this.planPagoService.buscarPlanPagoVenta(dto.idPlan, queryRunner);
        if(!plan){
          throw new NotFoundException('No se encuentra el plan de pagos');
        }
        if(plan.estado=== EstadoPlanPago.COMPLETADO){
          throw new BadRequestException('El plan de pagos ya esta completo');
        }
        if(plan.estado==EstadoPlanPago.ANULADO){
          throw new BadRequestException('El plan de pago esta anulado')
        }
        const cuota= await this.coutaService.BuscarCuota(dto.idCuota,plan.id, queryRunner);
        if(!cuota){
          throw new NotFoundException('No se encuentra la cuota');
        }
        if(cuota.estado===EstadoCuota.ANULADA){
          throw new BadRequestException('esta cuota esta anulada');
        }if(cuota.estado===EstadoCuota.PAGADA){
          throw new BadRequestException('La cuota ya esta pagada');
        }
        //calcular mora 
        //const totalMora= await this.coutaService.calcularMora(plan, cuota);
        //console.log("total de mora: ", totalMora);
        
        const totalMovimientos = dto.movimientosF.reduce((acumulador, mov) => acumulador + mov.monto, 0); // es el valor con el que empieza acumulador
        const montoEsperado=dto.montoOperacion+dto.recargoMora

        if (Math.abs(totalMovimientos - montoEsperado) > 0.01) {
          throw new BadRequestException(`El total de los movimientos:${totalMovimientos} no cuadran con el monto esperado:${montoEsperado}`);
        }

        await this.coutaService.actualizarCuota(dto.montoOperacion,cuota, plan.moneda, queryRunner);
        await this.planPagoService.actualizarPlan(plan, dto.montoOperacion,dto.recargoMora, tipoCambio, queryRunner);

        const pago= await this.finanzasService.registrarPagoDeCuota(plan, cuota, dto, queryRunner);
        //en el cliente estamos enviando al reves el tipoMov en venta
        //registrar movF
        await queryRunner.commitTransaction();
        return pago;
    }catch(error){
      console.log(error)  
      await queryRunner.rollbackTransaction();
      throw error;
    }finally{
        await queryRunner.release();
    }

  }


  //usado por venta, compra para anular todo el plan de pago
  async anularPlanPago(idPlan:number, motivo:AnularPagoDto,  queryRunner:QueryRunner){
    console.log('cuentas service ');
    const plan = await queryRunner.manager.findOne(PlanPago,{
      where:{ id:idPlan },
      loadRelationIds:{relations:['cuotas']},
      lock:{ mode:'pessimistic_write' }
    });
    if(!plan){
      throw new NotFoundException('El plan de pagos no fue encontrado');
    }
    if(plan.estado===EstadoPlanPago.ANULADO){
      throw new BadRequestException('El plan de pagos ya esta anulado');
    }
    if(plan.cuotas.length===0){
      throw new BadRequestException('El plan de pagos no tiene cuotas')
    }
    //revertir todos los pagos de un plan 
    await this.finanzasService.reversarPagosPlan( idPlan, motivo, queryRunner);
    //anular todas las cuootas de un plan
    await this.coutaService.anularCuotasPlan(plan.cuotas, queryRunner);
    plan.estado = EstadoPlanPago.ANULADO;
    plan.fechaAnulacion = new Date();
    await queryRunner.manager.update(PlanPago,idPlan,{
      estado: EstadoPlanPago.ANULADO,
      fechaAnulacion:new Date()
    });
    console.log(plan);

  }

  //buscamos mediante id de cuota
  public async buscarCuotaPago(id: number) {
    //no usar query
    const queryRunner= this.dataSource.createQueryRunner(); 
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const cuota= await queryRunner.manager.findOne(Cuota,{
        where:{
          estado:EstadoCuota.PAGADA,
          id:id,
          pago:{
            estado:EstadoPago.REGISTRADO, 
          }
        }, relations:['pago', 'pago.movimientos']
      });
      if(!cuota){
        throw new NotFoundException("La cuota seleccionada no tiene pagos registrados");
      }
      //await queryRunner.commitTransaction()
      return cuota.pago;  
    } catch(error){
      console.log(error)  
      await queryRunner.rollbackTransaction();
      throw error;
    }finally{
        await queryRunner.release();
    }
    
  }
  //anular un pago unico **inicio
  async anularPagoServ( idPago:number, dto:AnularPagoDto){
    const queryRunner =this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
      const pagoAux= await this.finanzasService.anularPagoMovimientos(idPago, dto,queryRunner);
      console.log("pagoAux",pagoAux);
      const planPago:PlanPago=pagoAux.planPago;
      const cuota:Cuota=pagoAux.cuota;
      //revertir cuota
      cuota.estado = EstadoCuota.PENDIENTE;
      await queryRunner.manager.save(cuota);
      //fin revertir cuota
      //anularpagoPlan
      planPago.saldoPendiente =Number(planPago.saldoPendiente)+ Number(pagoAux.montoOperacion);
      planPago.saldoPendienteML=Number(planPago.saldoPendienteML)+Number(pagoAux.montoML);
      //verificar el estado y cambiarlo si es necesario
      await queryRunner.manager.save(planPago);
      //fin anularpagoPlan

      await queryRunner.commitTransaction();
       //console.log(pago)
      return{message:'Pago anulado correctamente'};
    }catch(error){
       await queryRunner.rollbackTransaction();
       throw error;
    }finally{
       await queryRunner.release();
    }
 
 }

}
