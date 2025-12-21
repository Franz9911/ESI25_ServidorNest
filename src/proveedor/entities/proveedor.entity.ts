import { IsOptional } from "class-validator";
import { Compra } from "src/compra/entities/compra.entity";
import { Cotizacion } from "src/compra/entities/cotizacion.entity";
import { Empresa } from "src/empresa/entities/empresa.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Proveedor {
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({length:8,comment:'estado del proveedor: activo o inactivo'})
    estado:string;
    @Column({nullable:true,length:255,comment:'codiciones de pago: plazo de pago, interes,anticipo, etc'})
    condicionesPago:string;
    @Column({nullable:true,length:80, comment:'Area en la que se desempeña el proveedor'})
    rubro:string
    @Column({nullable:true,comment:'puntuacion del representante deacuerdo a su desempeño laboral'})
    calificacion:number;
    @CreateDateColumn({comment:'fecha de regsitro proveedor'})
    fechaReg:Date;
    @OneToOne(()=>Empresa,(empresa)=>empresa.proveedor)
    @JoinColumn({name:'empresa',referencedColumnName:'id'})
    empresa:Empresa;
    @OneToMany(() => Compra, (compra) => compra.proveedor)
    compras: Compra[];

    @OneToMany(() => Cotizacion, cot => cot.proveedor)
    cotizaciones: Cotizacion[];

}
