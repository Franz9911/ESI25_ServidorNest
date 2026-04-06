import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { Compra } from "./compra.entity";
import { Proveedor } from "src/proveedor/entities/proveedor.entity";
import { Representante } from "src/representante/entities/representante.entity";
@Entity()
export class Cotizacion{
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({type:'decimal',precision:12,scale:2,comment:'monto total de la cotizacion',default:0 })
    total:number;

    @Column({nullable: true, comment:'pdf con la respuesta a la solicitud de cotizacion'})
    pdfRespuesta:string;
    
    @CreateDateColumn()
    fechaReg:Date;
    //vigencia:Date;
    @ManyToOne(()=>Compra, compra=>compra.cotizaciones,{onDelete:'CASCADE'})
    compra:Compra; //ordenCompra

    @ManyToOne(() => Proveedor, proveedor => proveedor.cotizaciones)
    @JoinColumn()
    proveedor: Proveedor;

    @ManyToOne(()=>Representante, representante => representante.cotizaciones)
    @JoinColumn()
    representante:Representante; 
}