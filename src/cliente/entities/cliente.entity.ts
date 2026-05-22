import { Empresa } from "src/empresa/entities/empresa.entity";
import { Persona } from "src/persona/entities/persona.entity";
import { Venta } from "src/venta/entities/venta.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Cliente {
    @PrimaryGeneratedColumn('increment',{comment:'identificador de cliente'})
    id:number;
    @Column({default:0,comment:'puntos acumulados por ventas y manteniineto'})
    puntosAcumulados:number;
    @Column({length:4, comment:'tipo de cliente: empresa (emp) o persona (per)'})
    tipoCliente:string;
    @CreateDateColumn()
    fechaReg:Date;
    @Column({length:8, comment:'estado del cliente: activo o inactivo'})
    estado:string;
    @OneToMany(()=>Venta,venta=>venta.cliente)
    venta:Venta[];

    @ManyToOne(() => Persona, { nullable: true })
    persona?: Persona;
    
    @ManyToOne(() => Empresa, { nullable: true })
    empresa?: Empresa; 
}
