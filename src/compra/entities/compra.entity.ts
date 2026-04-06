import { Proveedor } from "src/proveedor/entities/proveedor.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { DetalleCompra } from "./detalle.entity";
import { PlanPagoCompra } from "./plan-pago.entity";
import { Cotizacion } from "./cotizacion.entity";
import { EstadoCompra } from "src/common/enums/estado-compra.enum";
import { DevolucionCompra } from "./devolucion-compra.entity";

@Entity()
export class Compra {
    @PrimaryGeneratedColumn('increment')
    id:number;

    @CreateDateColumn({comment:'Fecha de registro'})
    fechaReg:Date;
    
    @Column({default:EstadoCompra.EN_CAMINO,comment:'estado de recepcion:cotizacion,cancelado,en camino,retrasado,recepcionado y verificado'})
    estadoRec:string;
    
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

    @OneToOne(()=>PlanPagoCompra,(planPagos)=>planPagos.compra)
    @JoinColumn({name:'planPagos',referencedColumnName:'id'})
    planPagos:PlanPagoCompra;
    
    @ManyToOne(() => Cotizacion, { nullable: true })
    @JoinColumn({ name: 'cotizacion_asignada' })
    cotizacionAsignada: Cotizacion;

    @OneToOne(()=>DevolucionCompra,(devolucion)=>devolucion.compra)
    @JoinColumn({name:'devolucion'})
    devolucion:DevolucionCompra;
}
