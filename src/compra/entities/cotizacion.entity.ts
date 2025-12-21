import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { Compra } from "./compra.entity";
import { Proveedor } from "src/proveedor/entities/proveedor.entity";
import { Representante } from "src/representante/entities/representante.entity";
@Entity()
export class Cotizacion{
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({type:'decimal',precision:12,scale:2,comment:'monto total de la cotizacion',default:0 })
    total:number;
    @Column({default:'no',comment:'identificador para el proveedor al cual se le asigno la OC: si o no'})
    asignado:string;
    @Column({nullable: true, comment:'pdf con la respuesta a la solicitud de cotizacion'})
    pdfRespuesta:string;
    //compra, proveedor,representante

    @ManyToOne(()=>Compra, compra=>compra.cotizaciones,{onDelete:'CASCADE'})
    compra:Compra;

    @ManyToOne(() => Proveedor, proveedor => proveedor.cotizaciones)
    @JoinColumn()
    proveedor: Proveedor;

    @ManyToOne(()=>Representante, representante => representante.cotizaciones)
    @JoinColumn()
    representante:Representante;
}