import { Empresa } from "src/empresa/entities/empresa.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class CuentaBancaria {
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column()
    estado:string;
    @CreateDateColumn({comment:'Fecha de registro'})
    fechaReg:Date;
    @Column({length:100,comment:'nombre del propietario de la cuenta'})
    titular:string;
    @Column({length:10, comment:'tipo de moneda de la cuenta:Bs,Sus'})
    moneda:string;
    @Column({length:30,comment:'numero de cuenta'})
    numCuenta:string;
    @Column({length:50,comment:'Nombre de la entidad financiera'})
    entidad:string;
    @Column({nullable:true, length:30,comment:'codigo swift'})
    swift:string;
    @Column({nullable:true, length:30,comment:'codigo swift'})
    iban:string;
    @ManyToOne(() => Empresa, empresa => empresa.cuentasBancarias, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'empresa' })
    empresa:Empresa;
}
