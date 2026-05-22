import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Compra } from "./compra.entity";
import { Producto } from "src/producto/entities/producto.entity";
import { Lote } from "src/inventario/entities/lote.entity";

@Entity()
export class DetalleCompra{
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({nullable:true, type:'decimal',precision:10,scale:2,comment:'costo'})
    precioUnit:number;
    @Column({nullable:true, type:'decimal',precision:10,scale:2,comment:'costo'})
    precioFinalUnit:number;
    @Column({type:'smallint',comment:'unidades adquiridas'})
    unidAdquiridas:number;
    @Column({nullable:true, type:'decimal',precision:10,scale:2,comment:'sub total del detalle'})
    subTotal:number;
    @Column({default:0, type:'smallint', comment:'unidades pendientes a entregarse'}) 
    unidPendientes:number;
    @Column({nullable: true, type:'decimal',  precision: 5, scale: 2, default: 0 })
    ivaPorcentaje: number;
    @Column({nullable:true, type:'decimal',  precision: 10, scale: 2, default: 0 })
    ivaMonto: number;
    @ManyToOne(()=>Producto)
    producto:Producto
    @ManyToOne(()=>Compra, compra=>compra.detalles,{onDelete:'CASCADE'})
    compra:Compra;
    @OneToMany(()=>Lote,lote =>lote.detalleCompra)
    lote:Lote[]
    
} 