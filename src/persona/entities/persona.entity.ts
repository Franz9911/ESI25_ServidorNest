
import { Empresa } from "src/empresa/entities/empresa.entity";
import { Representante } from "src/representante/entities/representante.entity";
import { Usuario } from "src/usuario/entities/usuario.entity";
import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Persona {
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({length:40, comment:'Nombres de la persona'})
    nombre:string;
    @Column({length:40, comment:'Apellidos de la persona'})
    apellidos:string;
    @Column({length:4, 
        comment:
        'Tipo de docuento: cedula de identidad=ci; numero de identidad tributaria=nit; numero de registro de contibuyentes=nrc'})
    tipoDoc:string;
    @Column({comment:'Numero del docuento'})
    numDoc:number;
    @Column({nullable:true, length:120, comment:'Direccion de vivienda actual'})
    direccion:string;
    @Column({comment:'numero de telefono celular personal'})
    celular:number;
    @Column({nullable:true,comment:'fecha de nacimiento de persona'})
    fechaNac:Date;
    @Column({nullable:true,comment:'Correo electronico'})
    correoE:string;
    @CreateDateColumn({comment:'Fecha de creacion del registro de persona'})
    fechaReg:Date;
    @OneToOne(()=>Usuario,usuario=>(usuario.persona))
    usuario:Usuario;

    @OneToMany(() => Representante, rep => rep.persona)
    representantes: Representante[];
    //cliente
}
