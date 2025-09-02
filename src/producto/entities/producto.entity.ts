import { Marca } from "src/marca/entities/marca.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Producto{
    @PrimaryGeneratedColumn('increment')
    id:number;

    @Column({nullable: true, length:60,comment:'Modelo del producto'})
    modelo:string;

    @Column({nullable: true, type:'smallint', comment:'Nivel minimo de unidades disponibles en almacen'})
    minUnidades:number;

    @Column({type:'smallint', comment:'Unidades disponibles en almacen'})
    unidadesDis:number;

    @Column({nullable: true, length:2550,comment:'descripcion tecnica del producto'})
    descripTec:string;
    
    @Column({length:2,comment:'Habiitar el producto para las ventas del sistema'})
    habilitarVenta:string;
    
    @Column({length:2,comment:'Habilitar el producto como refaccion para el sistema'}) 
    habilitarRefac:string;
    
    @Column({nullable: true, length:100,comment:'imagen descriptiva del producto'})
    imagenProd:string;
    
    @Column({nullable:true, comment:'Codigo del producto para Inpuestos Nacionales'})
    codigoSIM:number;
    //muchas productos comparten un marca.
    // (marca)=>marca.producto en la entidad arca debe existir un campo llamado producto.
    @ManyToOne(()=>Marca,(marca)=>marca.producto ) 
    @JoinColumn({name:"marca", referencedColumnName:"id"})
    marca:Marca;
}