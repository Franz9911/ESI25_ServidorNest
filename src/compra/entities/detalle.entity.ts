import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Compra } from "./compra.entity";
import { Producto } from "src/producto/entities/producto.entity";

@Entity()
export class DetalleCompra{
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({nullable:true, type:'decimal',precision:10,scale:2,comment:'costo'})
    precioUnit:number;
    @Column({type:'smallint',comment:'unidades adquiridas'})
    unidAdquiridas:number;
    @Column({nullable:true, type:'decimal',precision:10,scale:2,comment:'sub total del detalle'})
    subTotal:number;
    @Column({default:0, type:'smallint', comment:'unidades pendientes a entregarse'}) 
    unidPendientes:number;
    @ManyToOne(()=>Producto)
    producto:Producto
    @ManyToOne(()=>Compra, compra=>compra.detalles,{onDelete:'CASCADE'})
    compra:Compra;
} 