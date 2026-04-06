import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { PagoCompra } from "./pago-compra.entity";

@Entity()
export class Comprobante{
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({comment:'nombre de la imagen de comprobante'})
    nombre:string;
    @ManyToOne(()=> PagoCompra, pago =>pago.comprobantes)
    pago:PagoCompra;
    //pago
}