import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Lote } from "./lote.entity";
import { DetalleVenta } from "src/venta/entities/detalle-venta.entity";
import { EstadoDetalleLote } from "src/common/enums/detalle-lote.enum";
import { MoviminetoInventario } from "./movimiento-inventario.entity";

@Entity()
export class DetalleLote{
    @PrimaryGeneratedColumn('increment',{comment:'identificador de DetalleLote'})
    id:number;
    @Column({type:'smallint', comment:'unidades vendidas'})
    cantidad:number;
    @Column({type:'enum', enum:EstadoDetalleLote, comment:'estado de detalleLote: activo, inactivo'})
    estado:EstadoDetalleLote;
    @Column({nullable:true, comment:'fecha de anulacion'})
    fechaAnulacion?:Date;
    @CreateDateColumn({comment:'fecha de registro detalleLote'})
    fechaReg:Date;
    @Column({type:'decimal',precision:10,scale:2,comment:'precio de compra producto'})
    costoUnitML:number;
    @ManyToOne(()=>Lote, lote=>lote.detallesLote)
    lote:Lote
    @ManyToOne(()=>DetalleVenta,(detalleVenta)=>detalleVenta.detalleLote)
    @JoinColumn({name:'detalleVenta', referencedColumnName:'id'})
    detalleVenta:DetalleVenta;
    @OneToMany(()=>MoviminetoInventario, mov => mov.detalleLote)
    movimientosInventario:MoviminetoInventario[];

}