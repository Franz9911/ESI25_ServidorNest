import { Proveedor } from "src/proveedor/entities/proveedor.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { DetalleCompra } from "./detalle.entity";
//import { PlanPagoCompra } from "./plan-pago.entity";
import { Cotizacion } from "./cotizacion.entity";
import { EstadoCompra } from "src/common/enums/estado-compra.enum";
import { DevolucionCompra } from "./devolucion-compra.entity";
import { PlanPago } from "src/cuentas/entities/planPago.entity";
import { TipoCompraVentaEnum } from "src/common/enums/tipo-compro-venta.enum";

@Entity()
export class Compra {
    @PrimaryGeneratedColumn('increment')
    id:number;

    @CreateDateColumn({comment:'Fecha de registro'})
    fechaReg:Date;
    
    @Column({default:EstadoCompra.EN_CAMINO,comment:'estado de recepcion:cotizacion,cancelado,en camino,retrasado,recepcionado y verificado'})
    estadoRec:EstadoCompra;
    @Column({type:'enum', enum:TipoCompraVentaEnum,comment:'tipo de compra: al credito o al contado' })
    tipo:TipoCompraVentaEnum;
    @Column({nullable: true, type:'decimal', precision:10, scale:2,comment:'total de venta sin impuestos'})
    subTotal:number;
    @Column({default:0, type:'decimal', precision:6, scale:2, comment:'total de impuesto:suma de todos los imuestos en detalleVenta '})
    impuestoTotal:number;
    @Column({nullable:true, comment:'folder donde se ubican los archivos correpondientes a la orden de compra'})
    folder:string;
    //al no usar length el string no tiene limite en la db. Podiendo almacenar hasta 1Gb teoricamente 
    @Column({nullable:true, comment:'Observaciones referentes a la recepcion del producto o al envio. Ejem: retrasos, faltantes, productos dañados'})
    observaciones:string; 
    
    @Column({nullable:true, comment:'Descripcion del motivo de anulacion de la compra'})
    motivoAnulacion:string;
    
    @Column({nullable:true, comment:'fecha de anulacion de compra'})
    fechaAnulacion:Date;
    
    @ManyToOne(()=>Proveedor,proveedor=>proveedor.compras)
    proveedor:Proveedor;

    @OneToMany(()=>DetalleCompra, detalles =>detalles.compra)
    detalles:DetalleCompra[];

    @OneToMany(()=>Cotizacion,cotizaciones=>cotizaciones.compra)
    cotizaciones:Cotizacion[];

    @OneToOne(()=>PlanPago, (planPag)=>planPag.compra)
    @JoinColumn({name:'plan_pago', referencedColumnName:'id'})
    planPag:PlanPago;
    
    @ManyToOne(() => Cotizacion, { nullable: true })
    @JoinColumn({ name: 'cotizacion_asignada' })
    cotizacionAsignada: Cotizacion;

    @OneToOne(()=>DevolucionCompra,(devolucion)=>devolucion.compra)
    @JoinColumn({name:'devolucion'})
    devolucion:DevolucionCompra;
}
