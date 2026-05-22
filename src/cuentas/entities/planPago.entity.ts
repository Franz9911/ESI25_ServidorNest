import { EstadoPlanPago } from 'src/common/enums/estado-plan-pago.enum';
import { Compra } from 'src/compra/entities/compra.entity';
import { Venta } from 'src/venta/entities/venta.entity';
import { Entity, CreateDateColumn, OneToOne, PrimaryGeneratedColumn,} from 'typeorm';
import { Column } from 'typeorm/decorator/columns/Column';
import { OneToMany } from 'typeorm/decorator/relations/OneToMany';
import { Cuota } from './cuota.entity';
import { Pago } from 'src/finanzas/entities/pago.entity';

@Entity('plan_pago') 
export class PlanPago {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'smallint' })
  numCuotas: number;
  @Column({ nullable: true })
  frecuencia: string;
  @Column({ type: 'timestamp' })
  fechaInicio: Date;
  @Column({ type: 'enum', enum: EstadoPlanPago,
    default: EstadoPlanPago.ACTIVO,
  })
  estado: EstadoPlanPago;
  @Column({length:4})
  moneda: string; // BOB, USD

  @Column({ type:'decimal', precision:10, scale:4, nullable:true})
  tipoCambio?: number;
  @Column('decimal', { precision:12, scale:2})
  montoTotal: number;

  @Column('decimal', { precision:12, scale:2})
  saldoPendiente: number;
  //solo para compras
  @Column({type:'decimal', precision:12, scale:2, nullable:true})
  montoTotalML?: number;
  @Column({type:'decimal', precision:12,scale:2, nullable:true})
  saldoPendienteML?: number;
  @Column({type:'decimal', precision:5, scale:2, nullable:true,comment:'interes por mora 0.02'})
  mora?: number;
  @Column({nullable:true, comment:'mensual, quicenal' })
  tipoMora?: string;
  @Column({type:'decimal', precision:10, scale:2, nullable:true})
  interes: number;
  @Column({type:'decimal', precision: 12, scale: 2, default: 0})
  totalRecargoMora: number;
  @Column({type:'decimal', precision: 12, scale: 2, default: 0})
  anticipo: number;
  @CreateDateColumn()
  fechaReg: Date;
  @Column({default:null, comment:'fecha de anulacion'})
  fechaAnulacion:Date;

  //relaciones
  @OneToMany(() => Cuota, cuotas => cuotas.planPago, { cascade: true })
  cuotas: Cuota[];

  @OneToMany(() => Pago, pagos => pagos.planPago)
  pagos: Pago[];

  @OneToOne(() => Venta, (venta) => venta.planPagos, { nullable: true })
  venta?: Venta;

  @OneToOne(() => Compra, (compra) => compra.planPag, { nullable: true })
  compra?: Compra;
}
