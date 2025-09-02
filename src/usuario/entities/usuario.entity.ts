import { type } from "os";
import { Persona } from "src/persona/entities/persona.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Usuario {
   @PrimaryGeneratedColumn('increment',
      {comment:'numero de identificacion del usuario'})
   id:number;
   @Column({length:30,comment:'nombre de usuario'})
   nombreU:string;
   @Column({length:90, comment:'contraseña del usuario'})
   contrasenha:string;
   @Column({length:5, comment:'rol asignado al usuario: adimnistrador=AdmG; vendedor=A.Ven; Tecnico=S.Tec'})
   rol:string;
   @Column({nullable: true,length:100, comment:'fotografia del usuario'})
   fotografia:string;
   @Column({length:8, 
      comment:'estado de la cuenta del usuario: activo=act; inactivo=inac'})
   estado:string;
   
   @CreateDateColumn({comment:'fecha de creacion del registro de usuario'})
   fechaReg:Date;

   @OneToOne(()=>Persona,(persona)=>(persona.usuario))
   @JoinColumn({name:'persona',referencedColumnName:'id'})
   persona:Persona; 
}

