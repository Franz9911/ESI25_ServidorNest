import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { DetalleVenta } from "./detalle-venta.entity";
import { Cliente } from "src/cliente/entities/cliente.entity";
import { PlanPago } from "src/cuentas/entities/planPago.entity";
import { EstadoVenta, TipoVenta } from "src/common/enums/venta.enum";


@Entity()
export class Venta {
    @PrimaryGeneratedColumn('increment',{comment:'identificador de venta'})
    id:number;
    @Column({type:'enum',enum: EstadoVenta, default: EstadoVenta.ACTIVO, comment:'estado de venta:activa, anulada,borrador'})
    estado:EstadoVenta;
    @Column({type:'enum',enum:TipoVenta, comment:'tipo de venta: contado, creadito, cotizacion'})
    tipo:TipoVenta; 
    @CreateDateColumn({comment:'fecha de registro venta'})
    fechaReg:Date;
    @Column({nullable:true, comment:'concepto de venta, descripcion para facturar'})
    concepto:string;
    @Column({nullable: true, type:'decimal', precision:10, scale:2,comment:'total de venta sin impuestos'})
    subTotal:number;
    @Column({default:0, type:'decimal', precision:5, scale:2, comment:'total de impuesto:suma de todos los imuestos en detalleVenta '})
    impuestoTotal:number;
    @Column({nullable:true, comment:'motivo de anulacion de venta'})
    motivoAnulacion:string
    @Column({nullable:true, comment:'fecha de anulacion'})
    fechaAnulacion:Date;

    @ManyToOne(()=>Cliente,(cliente) => cliente.venta)
    cliente:Cliente;

    @OneToMany(()=>DetalleVenta,detalles=>detalles.venta)
    detalles:DetalleVenta[];

    @OneToOne(()=>PlanPago, (planPagos)=>planPagos.venta)
    @JoinColumn({name:'planPagos',referencedColumnName:'id'})
    planPagos:PlanPago;
}
