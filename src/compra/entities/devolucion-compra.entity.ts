import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Compra } from "./compra.entity";
import { DetalleDevolucionCompra } from "./detalle-devolucion-compra.entity";

@Entity()
export class DevolucionCompra{
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({comment:'estado de devolucion:anulado,activa,borrador'})
    estado:string;
    @Column({comment:'mitivo de la devolucion'})
    motivo:string;
    @Column({type:'decimal',scale:2,precision:12,comment:'monto total de la devolucion'})
    montoTotalDev:number;
    @Column()
    usuarioId:number;
    @OneToOne(()=>Compra, compra =>(compra.devolucion))
    compra:Compra;
    //compra:number;
    @OneToMany(()=>DetalleDevolucionCompra,detalleDev=>detalleDev.devolucion)
    detalleDevolucion:DetalleDevolucionCompra[];

}