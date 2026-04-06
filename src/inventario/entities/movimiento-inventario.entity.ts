import { Producto } from "src/producto/entities/producto.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Lote } from "./lote.entity";

@Entity()
export class MoviminetoInventario{
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({type:'smallint',comment:'cantidad de unidades movidas'})
    cantidad:number;
    @Column({length: 20, comment:'tipo de movimiento'})
    tipo:string;
    @Column({type:'decimal',scale:2,precision:10, comment:'costo unitario de producto'})
    costoUnit?:number;
    @Column({comment:'motivo del movimiento'})
    motivo:string;
    @Column({length:7, comment:'sentido del movimiento'})
    sentido:string;
    //lote producto
    @ManyToOne(() => Producto)
    producto: Producto;
    @ManyToOne(() => Lote)
    lote?: Lote;
}