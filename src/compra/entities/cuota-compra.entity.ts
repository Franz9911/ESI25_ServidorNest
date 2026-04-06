import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { PlanPagoCompra } from "./plan-pago.entity";
import { PagoCompra } from "./pago-compra.entity";
import { EstadoCuota } from "src/common/enums/estado-cuota.enum";
@Entity()
export class CuotaCompra{
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({comment:'fecha de pago'})
    fechaPago:Date;
    @Column({type:'smallint',comment:'numero de cuota'})
    numCuota:number;
    @Column({default:EstadoCuota.PENDIENTE,comment:'estado de cuota: pagada, anulada, pendiente'})
    estado:string;
    @Column({type:'decimal',precision:12, scale:2, comment:'monto a pagar la moneda esta especificada en el plan'})
    monto:number;
    @ManyToOne(()=>PlanPagoCompra,plan=>plan.cuotas)
    @JoinColumn()
    plan:PlanPagoCompra;

    @OneToOne(()=>PagoCompra,(pagoCompra)=>pagoCompra.cuota)
    @JoinColumn({name:'pagoCompra',referencedColumnName:'id'})
    pago?:PagoCompra;
}