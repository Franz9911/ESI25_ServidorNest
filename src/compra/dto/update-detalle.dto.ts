import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { CreateDetalleCompra } from "./create-detalle.dto";
import { Producto } from "src/producto/entities/producto.entity";
export class UpdateDetalle extends PartialType(CreateDetalleCompra){
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    id?: number;
    @IsNumber()
    @Type(()=>Number)
    precioUnit:number;
    @IsString()
    fechaReg:Date;
    @IsNotEmpty()
    producto:Producto;
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    subTotal?:number;
}