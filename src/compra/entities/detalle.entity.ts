import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Compra } from "./compra.entity";
import { Producto } from "src/producto/entities/producto.entity";

@Entity()
export class DetalleCompra{
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({type:'decimal',precision:10,scale:2,comment:'costo'})
    precioUnit:number;
    @Column({type:'smallint',comment:'unidades adquiridas'})
    unidAdquiridas:number;
    @Column({type:'smallint',comment:'unidades disponibles'})    
    unidDisponibles:number;
    @Column({nullable:true, type:'decimal',precision:10,scale:2,comment:'precio de venta al por menor sugerido'})
    precioMin:number;
    @Column({ nullable: true, type:'decimal',precision:10,scale:2,comment:'precio de venta al por mayor sugerido'})
    precioMay:number;
    @ManyToOne(()=>Producto,{eager:true})
    producto:Producto
    @ManyToOne(()=>Compra, compra=>compra.detalles,{onDelete:'CASCADE'})
    compra:Compra;
}