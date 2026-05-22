import { BadRequestException, Injectable, NotAcceptableException } from '@nestjs/common';
import { PlanPago } from '../entities/planPago.entity';
import { In, QueryRunner } from 'typeorm';
import { Cuota } from '../entities/cuota.entity';
import { EstadoCuota } from 'src/common/enums/estado-cuota.enum';

@Injectable()
export class CuotaService {
  async crearCoutaAlContado(planPago:PlanPago,queryRunner:QueryRunner){
    console.log("plan pago cuota service")
    const cuota = queryRunner.manager.create(Cuota,{
        estado:EstadoCuota.PAGADA,
        monto: planPago.montoTotal,
        numCuota:1,
        fechaVencimiento:new Date,
        planPago:planPago,
    });
    const cuotaReg= await queryRunner.manager.save(cuota);       
    return cuotaReg;
  }
     
  async crearCuotasCredito(plan:PlanPago,numCuotas:number,queryRunner:QueryRunner){
    let cuotas:Cuota[]=[];
    const montoBase=Math.floor(plan.montoTotal/numCuotas); //redondeo hacia abajo
    let resto= plan.montoTotal-montoBase*numCuotas; 
    const fechaIniAxu=new Date(plan.fechaInicio) 
    for(let i =1;i<=numCuotas;i++){
      const fecha = this.calcularFechaCuota(fechaIniAxu, i, plan.frecuencia );
      const monto= resto > 0 ? montoBase+1 : montoBase; //si resto > 0 entonces monto = montobase +1; caso contrario monto=montobase; 
      resto--;
      const cuota= queryRunner.manager.create(Cuota,{
          estado:EstadoCuota.PENDIENTE,
          monto:monto,
          numCuota:i,
          fechaVencimiento:fecha,
          planPago:plan,
      });
      cuotas.push(cuota);
    }
    const cuotasReg = await queryRunner.manager.save(cuotas);
    return cuotasReg;
  }

  private calcularFechaCuota(fechaInicio: Date, index: number, frecuencia:string): Date {
    if (frecuencia === 'mensual') {
      return this.calcularMensual(fechaInicio, index);
    }
    if (frecuencia === 'quincenal') {
      return this.calcularQuincenal(fechaInicio, index);
    }      
    throw new BadRequestException('frecuencia no valida');
  }  

  private calcularMensual(fechaInicio: Date, index: number): Date {
    const diaBase = fechaInicio.getDate();
    const fecha = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + index, 1);
    // último día del mes de fechaInicio
    const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, //avanzamos al siguiente mes 
      0 //dia cero nos permite volver el mes anterior y capturar el ultimo dia del mes sin importar si es 30 o 31 o 29 etc
    ).getDate();
    fecha.setDate(Math.min(diaBase, ultimoDia));
    return this.ajustarFechaHabil(fecha);
  }

  private calcularQuincenal(fechaInicio: Date, index: number): Date {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + (15 * (index)));
    return this.ajustarFechaHabil(fecha);
  }

  //evita ue la fecha de pago sea un dia domingo 
  private ajustarFechaHabil(fecha: Date): Date {
    const nueva = new Date(fecha);  
    if (nueva.getDay() === 0) {
      nueva.setDate(nueva.getDate() - 1);
    }   
    return nueva;
  }  
  public async BuscarCuota(idcuota:number,idPlan:number, queryRunner:QueryRunner){
    //siempre usar lock primero el plan y luego en cuota para evitar un bloqueo mutuo con otra operaciones
    return await queryRunner.manager.findOne(Cuota,{
      where:{
        id:idcuota,
        planPago:{
          id:idPlan
        }
      },
      lock:{mode:'pessimistic_write'}
    })
  }
  //registrar el pago de una cuota para compra o venta
  public async actualizarCuota(montoOperacion:number,cuota:Cuota,moneda:string, queryRunner:QueryRunner){
    const saldo=cuota.monto- Number(montoOperacion);
    console.log('saldo de cuota :', saldo);
    if (Number(montoOperacion) > cuota.monto) { 
      throw new BadRequestException('El pago excede el monto de la cuota');
    }
    if(saldo<=0){
      cuota.estado=EstadoCuota.PAGADA;
      await queryRunner.manager.save(cuota);
    }else{
      throw new  BadRequestException(`Te falta ${saldo.toFixed(2)} ${moneda} en el pago`)
    }
  }
  /*public async calcularMora(plan: PlanPago, cuota: Cuota,){
    const hoy = new Date();
    const fechaVencimiento = new Date(cuota.fechaVencimiento);
    if (hoy <= fechaVencimiento) {
      return 0;
    }
    const diferencia = hoy.getTime() - fechaVencimiento.getTime(); //diferencia en milisegundos
    const diasAtraso = Math.floor(diferencia / (1000 * 60 * 60 * 24));    
    let periodos = 0;
    switch (plan.tipoMora) {
      case 'mensual':
        periodos = Math.ceil(diasAtraso / 30);
        break;
      case 'quincenal':
        periodos = Math.ceil(diasAtraso / 15);
        break;
      default:
        periodos = 0;
    }
  
    const montoCuota = Number(cuota.monto);
    const porcentajeMora = Number(plan.mora);
    const totalMora = montoCuota *(porcentajeMora / 100) * periodos;
    return Number(totalMora.toFixed(2));
  }*/ 
  public async anularCuotasPlan(cuotas:any[], queryRunner:QueryRunner){
    //console.log("cuotas service");
    const idCuotas:number[]=cuotas;
    await queryRunner.manager.update(Cuota,{ id: In(idCuotas) },{
      estado: EstadoCuota.ANULADA,
      fechaAnulacion: new Date()
    });
  }
}
