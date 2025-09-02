import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class RegistroActividad {
    @PrimaryGeneratedColumn('increment')
    id:number
    @Column()
    usuarioResponsable:number;
    @Column()
    accion:string;
    @Column()
    entidad:string;
    @Column()
    idReferencial:number;
    @Column()
    datos:string;
    @CreateDateColumn({comment:'fecha de creacion del registro de persona'})
    fechaReg:Date;
}
