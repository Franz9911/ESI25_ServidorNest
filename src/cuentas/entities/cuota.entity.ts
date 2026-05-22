import { EstadoCuota } from "src/common/enums/estado-cuota.enum";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { PlanPago } from "./planPago.entity";
import { Pago } from "src/finanzas/entities/pago.entity";

@Entity('cuota')
export class Cuota {
  @PrimaryGeneratedColumn('increment')
  id: number;
  @Column({ type: 'smallint' })
  numCuota: number;
  @Column({ type: 'date' })
  fechaVencimiento: Date;
  @Column({type:'decimal', precision: 12, scale: 2})
  monto: number;
  @Column({type: 'enum', enum: EstadoCuota, default: EstadoCuota.PENDIENTE})
  estado: EstadoCuota;
  @Column({default: null, comment:"fecha de anulacion"})
  fechaAnulacion:Date;

  @ManyToOne(() => PlanPago, planPago => planPago.cuotas)
  @JoinColumn({ name: 'plan_pago_id' })
  planPago: PlanPago;

  @OneToMany(() => Pago, pago => pago.cuota, { nullable: true })
  pago?: Pago[];
  //fechaReg
}