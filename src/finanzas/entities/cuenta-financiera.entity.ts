import { Empresa } from "src/empresa/entities/empresa.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { MovimientoFinanciero } from "./movimiento-financiero.entity";
import { Moneda } from "src/common/enums/moneda.enum";
import { EstadoCuenta, TipoCuenta } from "src/common/enums/cuenta.enum";

@Entity('cuentas_financieras')
export class CuentaFinanciera {

  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'enum',
    enum: EstadoCuenta, 
    default: EstadoCuenta.ACTIVA
  })
  estado: EstadoCuenta;

  @Column({
    type: 'enum',
    enum: TipoCuenta
  })
  tipo: TipoCuenta;

  @CreateDateColumn()
  fechaReg: Date;

  @Column({ length: 100 })
  titular: string;

  @Column({
    type: 'enum',
    enum: Moneda
  })
  moneda: Moneda;

  @Column({ length: 30, unique: true })
  numCuenta: string;

  @Column({ length: 50 })
  entidad: string;

  @Column({ nullable: true, length: 30 })
  swift: string;

  @Column({ nullable: true, length: 30 })
  iban: string;

  //@ManyToOne(() => Empresa, empresa => empresa.cuentasFinancieras, {
    //onDelete: 'CASCADE'
  //})
  //@JoinColumn({ name: 'empresa_id' })
  //empresa: Empresa;

  //@OneToMany(() => MovimientosFinancieros, m => m.cuenta)
  //movimientos: MovimientosFinancieros[];
}