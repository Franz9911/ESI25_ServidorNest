import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Venta } from "./venta.entity";
import { Producto } from "src/producto/entities/producto.entity";
import { DetalleLote } from "src/inventario/entities/detalle-lote.entity";

@Entity()
export class DetalleVenta{
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({type:'decimal',precision:10,scale:2, comment:'precio unitario del producto en venta en moneda local'})
    precioUnit:number;
    @Column({comment:'unidades vendidas del producto'})
    unidades:number;
    @Column({nullable: true, type:'decimal',precision:10,scale:2, comment:'subtotal= precioUnit*unidades en moneda local'})
    subTotal:number;
    @Column({type:'decimal',precision:10, scale:2, comment:'descuento por producto en moneda local'})
    descuento:number;
    @Column({nullable: true, type:'decimal', precision:10, scale:2, comment:'Precio final de venta por unidad'})
    precioFinalUnit:number;
    @Column('decimal', { precision: 5, scale: 2, default: 0 })
    ivaPorcentaje: number;
    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    ivaMonto: number;
    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    totalDetalle:number;
    
    @CreateDateColumn({comment:'fecha de registro detelle venta'})
    fechaReg:Date;
    @ManyToOne(()=>Venta, venta=>venta.detalles)
    venta:Venta;
    @ManyToOne(()=>Producto,{nullable:false})
    producto:Producto;
    @OneToMany(()=>DetalleLote,detalleLote =>(detalleLote.detalleVenta))
    detalleLote:DetalleLote[];
}