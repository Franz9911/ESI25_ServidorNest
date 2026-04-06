import { DetalleCompra } from "src/compra/entities/detalle.entity";
import { Producto } from "src/producto/entities/producto.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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
    @Column({comment:'fecha de ingreso'})
    fechaIngreso:Date;
    @Column({comment:'estado del lote: ingresado, anulado, borrador'})
    estado:string;
    @Column({nullable: true, comment:'observaciones del lote para el registro de problesmas, errores o desperfectos'})
    observaciones:string;
    // origen : para lotes que no tienen un detalle y son producto de un ajuste de inventario
    @Column({comment:'describe el origen del lote: detalle, ajuste, etc'})
    origen:string;
    //muchos lotes tienen un mismo producto
    @ManyToOne(() => Producto)
    producto: Producto;
    //muchos lotes comparten un detalle
    @ManyToOne(() => DetalleCompra, { nullable: true })
    detalleCompra?: DetalleCompra;

}
