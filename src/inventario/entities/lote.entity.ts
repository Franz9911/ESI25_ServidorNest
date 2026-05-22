import { DetalleCompra } from "src/compra/entities/detalle.entity";
import { Producto } from "src/producto/entities/producto.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DetalleLote } from "./detalle-lote.entity";
import { EstadoLote } from "src/common/enums/estado-lote.enum";

@Entity()
export class Lote {
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({type:'smallint', comment:'unidades iniciales'})
    unidadesIni:number;
    @Column({type:'smallint', comment:'unidades disponibles'})
    unidadesDis:number;
    @CreateDateColumn()
    fechaReg:Date;
    @Column({type:'decimal',precision:10,scale:2, comment:'precio unitario del producto'})
    costoUnitML:number; //cambiar el nombre a costoUnitBaseML este valor no incluye el IVA
    @Column({comment:'fecha de ingreso'})
    fechaIngreso:Date;
    @Column({nullable:true,comment:'fecha de anulacion'})
    fechaAnulacion?:Date;
    @Column({default:EstadoLote.INGRESADO, type:'enum',enum:EstadoLote,comment:'estado del lote: ingresado, anulado, borrador'})
    estado:EstadoLote;
    @Column({nullable: true, comment:'observaciones del lote para el registro de problesmas, errores o desperfectos'})
    observaciones:string;
    // origen : para lotes que no tienen un detalle y son producto de un ajuste de inventario
    @Column({comment:'describe el origen del lote: detalle, ajuste, etc'})
    origen:string;
    //muchos lotes tienen un mismo producto
    @ManyToOne(() => Producto) 
    producto: Producto;
    //muchos lotes comparten un detalle
    @ManyToOne(() => DetalleCompra,detallecompra=>detallecompra.lote, { nullable: true })
    detalleCompra?: DetalleCompra;

    @OneToMany(()=>DetalleLote,detallesLote =>detallesLote.lote)
    detallesLote:DetalleLote[];
}
