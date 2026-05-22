import { Type } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";
import { Producto } from "src/producto/entities/producto.entity";

export class CreateDetalleVentaDto{
    

    @IsNumber()
    @Type(()=>Number)
    unidades:number;
    @IsNumber()
    @Type(()=>Number)
    descuento:number;
    @IsNumber()
    @Type(()=>Number)
    idProducto:number;
    //producto:Producto;


}