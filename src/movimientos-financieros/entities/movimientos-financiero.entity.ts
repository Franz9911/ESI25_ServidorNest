import { PagoCompra } from "src/compra/entities/pago-compra.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class MovimientosFinancieros {
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({comment:'tipo de movimiento: ingreso o egreso'})
    tipoM:string;
    @Column({nullable:true, comment:'idntificado de la operacion: ejem. num factura'})
    referencia:string;
    //estos datos solo debe se usados si la compra o venta se realizo usando una moneda extranjera por lo tanto no son obligatorios
    @Column({nullable:true,type:'decimal',precision:12,scale:2,comment:'catidad de dinero en movimiento'})
    monto:number; 
    @Column({nullable:true,comment:'moneda referente al monto'})
    moneda:string;
    @Column({nullable:true,type:'decimal',precision:12,scale:4, comment:'tipo de cambio'})
    tipoCambio:number;
    //obligatorio
    @Column({type:'decimal',precision:12,scale:2, comment:'monto de la operacion en moneda local'})
    montoML:number;
    
    //este concepto debe ser generado por el sistema identificando el numero de cuata y la orden de compra
    @Column({comment:'motivo del movimiento financiero'})
    concepto:string;
    @Column({default:'activo', comment:'estado del movimiento: activo o reversado'})
    estado:string; //quitar no se usa
    @CreateDateColumn({comment:'fecha de registro'})
    fechaReg:Date;
    @ManyToOne(() => PagoCompra, pago => pago.movimientos)
    @JoinColumn()
    pagoCompra!:PagoCompra;
    //cuentaFinanciera:cuenta
}
