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

    @Min(0, { message: 'Las unidades disponibles no pueden estar vacías' })
    @IsNumber()
    @Type(() => Number)
    unidadesDis: number;
    
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
