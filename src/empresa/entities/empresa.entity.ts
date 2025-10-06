import { CuentaBancaria } from "src/cuenta-bancaria/entities/cuenta-bancaria.entity";
import { Persona } from "src/persona/entities/persona.entity";
import { Proveedor } from "src/proveedor/entities/proveedor.entity";
import { Representante } from "src/representante/entities/representante.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Empresa {
    @PrimaryGeneratedColumn('increment')
    id:number;

    @Column({length:40, comment:'nombre  razon social de la empresa'})
    razonSocial:string;

    @Column({length:3, comment:'tipo de documento NIT'})
    tipoDoc:string;

    @Column({comment:'numero de NIT'})
    numDoc:number;

    @Column({comment:'telefono o celular'})
    celular:number;

    @Column({nullable:true,length:80, comment:'correo electronico de la empresa'})
    correoE:string;

    @Column({nullable:true,length:180, comment:'direccion fisica de la empresa'})
    direccion:string;

    @Column({nullable:true,length:100, comment:'pagina web de la empresa'})
    web:string;

    @Column({length:7,comment:'tipo de empresa: interna o externa'})
    tipoEmpresa:string;

    @CreateDateColumn({comment:'fecha de registro de la empresa en el sistema'})
    fechaReg:Date;
    
    
    @OneToMany(() => Representante, rep => rep.empresa)
    representantes: Representante[];

    @OneToMany(() => CuentaBancaria, cb => cb.empresa)
    cuentasBancarias: CuentaBancaria[];

    @OneToOne(()=>Proveedor,proveedor=>(proveedor.empresa))
    proveedor:Proveedor;
}
