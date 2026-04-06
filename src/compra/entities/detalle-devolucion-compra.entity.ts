import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { DevolucionCompra } from "./devolucion-compra.entity";
import { Lote } from "src/inventario/entities/lote.entity";
import { DetalleCompra } from "./detalle.entity";

@Entity()
export class DetalleDevolucionCompra{
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({type:'smallint',comment:'unidades devueltas'})
    unidadesDev:number;
    @Column({type:'decimal',scale:2,precision:12,comment:'precio unitario del producto'})
    precioUnit:number;
    @Column({type:'decimal',scale:2,precision:12,comment:'sub total del producto'})
    subTotal:number;
    @ManyToOne(() => DevolucionCompra)
    @JoinColumn({ name: 'idDevolucion' })
    devolucion: DevolucionCompra;

    @ManyToOne(()=>Lote) //muchos a uno
    @JoinColumn({name:'idLote'})
    lote:Lote;

    @ManyToOne(()=>DetalleCompra) //muchos a uno
    @JoinColumn({name:'idDetalleCompra'})
    DetalleCompra:DetalleCompra;
    //detallecompra
}