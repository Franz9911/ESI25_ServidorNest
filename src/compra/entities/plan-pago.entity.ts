import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Compra } from "./compra.entity";
import { PagoCompra } from "./pago-compra.entity";
import { CuotaCompra } from "./cuota-compra.entity";
import { EstadoPlanPago } from "src/common/enums/estado-plan-pago.enum";

@Entity()
export class PlanPagoCompra{
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({type:'smallint',comment:'numero de cuotas del plande pagos'})
    numCuotas:number;
    
    @Column({nullable:true, length:6,comment:'quicenal, mensual'})
    frecuencia:string;
    
    @Column({ default: 0,type:'decimal',precision:12,scale:2, comment:'total de recargas por mora de compra'})
    totalRecargoMora:number;
    @Column({type:'decimal',precision:12, scale:2,comment:'total a pagar por la compra'})
    montoTotalOperacion:number;
    @Column({type:'decimal',precision:12, scale:2,comment:'total a pagar por la compra'})
    montoTotalML:number;
    @Column({comment:'moneda usada en la tranzaccion: BOB, USD, etc'})
    monedaOperacion:string; 
    @Column({type:'decimal',precision:10,scale:4 ,comment:'tipo de cambio de moneda usada para la operacion'})
    tipoCambio:number;
    @Column({comment:'fecha de inicio del plan de pagos'})
    fechaInicio:Date;
    @Column({type:'decimal',precision:12,scale:2,comment:'monto pendiente de pago'})
    saldoPendiente:number;
    @Column({type:'decimal',precision:12,scale:2,comment:'monto pendiente de pago'})
    saldoPendienteML:number;
    @Column({default:EstadoPlanPago.ACTIVO,comment:'estado: activo, completado, cancelado'})
    estado:string;
    @CreateDateColumn() 
    fechaReg:Date
    //compra
    @OneToOne(()=>Compra,compra =>(compra.planPagos))
    compra:Compra

    @OneToMany(()=>CuotaCompra,cuotas=>cuotas.plan)
    cuotas:CuotaCompra[];
} 