import { Producto } from "src/producto/entities/producto.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Lote } from "./lote.entity";
import { DetalleLote } from "./detalle-lote.entity";
import { SentidoMovInventario, TipoMovInventario } from "src/common/enums/tipo-movimiento-inventario.enum";

@Entity()
export class MoviminetoInventario{
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({type:'smallint',comment:'cantidad de unidades movidas'})
    cantidad:number;
    @CreateDateColumn({comment:'fecha de registro de movimiento de inventario'})
    fechaReg:Date;
    @Column({type:'enum',enum:TipoMovInventario, comment:'tipo de movimiento'})
    tipo:TipoMovInventario;
    @Column({type:'decimal',scale:2,precision:10, comment:'costo unitario de producto'})
    costoUnit?:number;
    @Column({comment:'motivo del movimiento'})
    motivo:string;
    @Column({default:false, comment:'true= sin efecto en inventario, false= afecta a inventario '})
    anulado:boolean;
    @Column({nullable:true, comment: 'fecha de anulacion'})
    fechaAnulacion?:Date;
    @Column({type:'enum',enum:SentidoMovInventario, comment:'sentido del movimiento'})
    sentido:SentidoMovInventario;
    //lote producto
    @ManyToOne(() => Producto)
    producto: Producto;
    @ManyToOne(() => Lote) 
    lote?: Lote;
    @ManyToOne(() => DetalleLote, { nullable:true })
    @JoinColumn({ name:'detalle_lote_id' })
    detalleLote?:DetalleLote;
}