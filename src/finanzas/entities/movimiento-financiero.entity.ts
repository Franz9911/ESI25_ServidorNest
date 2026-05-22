import { MetodoPagoMovimientoF, TipoMovimientoFinanciero } from "src/common/enums/tipo-movimento-financiero.enum";
import { Column, CreateDateColumn, JoinColumn, ManyToOne } from "typeorm";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/decorator/entity/Entity";
import { Pago } from "./pago.entity";

@Entity('movimiento_financiero')
export class MovimientoFinanciero {
  @PrimaryGeneratedColumn('increment')
  id: number;
  @Column({ type: 'enum', enum: TipoMovimientoFinanciero})
  tipoMov: TipoMovimientoFinanciero;
  @Column({ nullable: true })
  referencia: string; 
  //@Column({ length: 5 })
  //moneda: string;
  @Column({type:'enum',enum:MetodoPagoMovimientoF, comment: 'metodo de pago' })
  metodoPago: MetodoPagoMovimientoF;
  @Column({type:'decimal', precision:12, scale:2, nullable: true})
  monto: number;
  //@Column({type:'decimal',  precision:10, scale:4, nullable:true})
  //tipoCambio: number;

  // obligatorio
  @Column({default:false,comment:"define si el movimiento ya hacido revertido o esta activo"})
  movRevertido:boolean;
  @Column({default:true, comment:'define si el movimiento es original= true o es producto de una revercion=false'})
  movOrigen:boolean;
  @Column({type:'decimal', precision: 12, scale:2})
  montoML: number; //monto en Moneda Local
  @Column({comment: 'descripcion del movimiento'})
  concepto: string;
  @Column({nullable:true,comment:'define el movimiento original al que anula este movimiento'})
  movimientoOriginalId:number;
  @CreateDateColumn() 
  fechaReg: Date;
  @ManyToOne(() => Pago, pago => pago.movimientos)
  @JoinColumn({ name: 'pago_id' })
  pago: Pago;
  // CUENTA FINANCIERA
  //@ManyToOne(() => CuentaFinanciera, cuenta => cuenta.movimientos)
  //@JoinColumn({ name: 'cuenta_id' })
  //cuenta: CuentaFinanciera;
}
