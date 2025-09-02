import { Producto } from "src/producto/entities/producto.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
@Entity()
export class Marca {
    @PrimaryGeneratedColumn('increment')
    id:number;
    @Column({length:40, comment:'Nombre de marca'})
    nombre:string;
    //una marca tiene muchos productos 
    //=>producto.marca indica que la entidad producto debe tener un campo llamado marca
    @OneToMany(()=>Producto,(producto)=>producto.marca)
    producto:Producto[]
    
}
