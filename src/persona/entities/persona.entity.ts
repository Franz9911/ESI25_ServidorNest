import { Usuario } from "src/usuario/entities/usuario.entity";
import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Persona {
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({length:40, comment:'nombres de la persona'})
    nombre:string;
    @Column({length:40, comment:'apellidos de la persona'})
    apellidos:string;
    @Column({length:4, 
        comment:
        'tipo de docuento: cedula de identidad=ci; numero de identidad tributaria=nit; numero de registro de contibuyentes=nrc'})
    tipoDoc:string;
    @Column({comment:'numero del docuento'})
    numDoc:number;
    @Column({length:100, comment:'direccion actual de la persona'})
    direccion:string;
    @Column({comment:'numero de telefono celular personal'})
    celular:number;
    @Column({nullable:true,comment:'fecha de nacimiento de persona'})
    fechaNac:Date;
    @CreateDateColumn({comment:'fecha de creacion del registro de persona'})
    fechaReg:Date;
    @OneToOne(()=>Usuario,usuario=>(usuario.persona))
    usuario:Usuario;  
}
