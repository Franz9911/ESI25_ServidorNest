import { Cotizacion } from "src/compra/entities/cotizacion.entity";
import { Empresa } from "src/empresa/entities/empresa.entity";
import { Persona } from "src/persona/entities/persona.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
@Entity()
export class Representante {
    @PrimaryGeneratedColumn('increment')
    id:number;

    @ManyToOne(() => Empresa, empresa => empresa.representantes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'empresa' })
    empresa: Empresa;

    @ManyToOne(() => Persona, persona => persona.representantes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'persona' })
    persona: Persona;

    @OneToMany(() => Cotizacion, cot => cot.representante)
    cotizaciones: Cotizacion[];

    
    @Column({length:8,comment:'estado del representante: activo, inactivo' })
    estado:string;
    @CreateDateColumn({comment:'fecha de registro'})
    fechaReg:Date;
}
