import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";
import { Marca } from "src/marca/entities/marca.entity";

export class CreateProductoDto {

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    marcaId:number;

    @IsNotEmpty()
    @IsString()
    marcaNombre:string;

    @IsNotEmpty()
    @IsString()
    modelo:string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    minUnidades:number;

    @Min(10, { message: 'El margen de ganancia es demaciado bajo' })
    @IsNumber()
    @Type(() => Number)
    margenGanancia: number;
    
    @IsOptional()
    descripTec:string;
    
    @IsNotEmpty()
    habilitarVenta:string;
    @IsNotEmpty() 
    habilitarRefac:string;
    @IsOptional()
    imagenProd:string;
    @IsOptional()
    codigoSIM:number;
}
