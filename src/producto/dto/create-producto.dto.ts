import { IsNotEmpty, IsOptional, IsString, Min, MinLength } from "class-validator";
import { Marca } from "src/marca/entities/marca.entity";

export class CreateProductoDto {

    @IsNotEmpty()
    marcaId:number;
    @IsNotEmpty()
    @IsString()
    marcaNombre:string;
    @IsNotEmpty()
    @IsString()
    modelo:string;
    @IsOptional()
    minUnidades:number;
    @Min(1,{message:'Las unidades disponibles no pueden estar vacias'})
    unidadesDis:number;
    @IsOptional()
    descripTec:string;
    @IsOptional()
    habilitarVenta:string;
    @IsOptional() 
    habilitarRefac:string;
    @IsOptional()
    imagenProd:string;
    @IsOptional()
    codigoSIM:number;
}
