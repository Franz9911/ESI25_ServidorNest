import { Empresa } from "src/empresa/entities/empresa.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Proveedor {
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({length:8,comment:'estado del proveedor: activo o inactivo'})
    estado:string;
    @Column({nullable:true,length:255,comment:'codiciones de pago: plazo de pago, interes,anticipo, etc'})
    condicionesPago:string;
    @CreateDateColumn({comment:'fecha de regsitro proveedor'})
    fechaReg:Date;
    @OneToOne(()=>Empresa,(empresa)=>empresa.proveedor)
    @JoinColumn({name:'empresa',referencedColumnName:'id'})
    empresa:Empresa;
    //calificacion:number
}
