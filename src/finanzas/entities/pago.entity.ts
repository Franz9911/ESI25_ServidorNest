import { EstadoPago } from "src/common/enums/estado-pago.enum";
import { Comprobante } from "src/compra/entities/comprobante.entity";
import { Cuota } from "src/cuentas/entities/cuota.entity";
import { PlanPago } from "src/cuentas/entities/planPago.entity";
import { MovimientoFinanciero } from "src/finanzas/entities/movimiento-financiero.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('pagos')
export class Pago {

  @PrimaryGeneratedColumn('increment')
  id: number;
  @Column({ comment: 'moneda de la operacion (BOB, USD)' })
  monedaOperacion: string;
  @Column({type:'decimal', precision:10, scale:4, default: 1})
  tipoCambio: number;
  @Column({type: 'decimal', precision:12, scale:2, comment: 'monto pagado en moneda de operacion'})
  montoOperacion: number;
  @Column({type:'decimal', precision: 12, scale:2, comment:'monto en moneda local'})
  montoML: number;
  @Column({type:'decimal', precision:5, scale:2, default:0})
  recargoMora: number;
  @Column({ nullable: true })
  numComprobante: string;
  @Column({type: 'enum', enum:EstadoPago, default: EstadoPago.REGISTRADO})
  estado: EstadoPago;
  @Column({ nullable: true })
  concepto: string;

  @CreateDateColumn()
  fechaPago: Date;
  @Column({ nullable:true })
  motivoAnulacion:string;

  @Column({ type:'timestamp', nullable:true })
  fechaAnulacion:Date;
  
  @ManyToOne(() => Cuota, cuota => cuota.pago)
  @JoinColumn({ name: 'cuota_id' })
  cuota: Cuota;

  @ManyToOne(()=> PlanPago, planPago =>planPago.pagos)
  planPago:PlanPago;
  // movimientos financieros
  @OneToMany(() => MovimientoFinanciero, m => m.pago)
  movimientos: MovimientoFinanciero[];

  

  //@OneToMany(() => Comprobante, c => c.pago, { cascade: true })
  //comprobantes: Comprobante[];
}