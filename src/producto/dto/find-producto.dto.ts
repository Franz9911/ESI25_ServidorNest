import { Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

export class BuscarProductosDto{
    @IsOptional()
    @IsString()
    categoria?:string;

    @IsOptional()
    @IsString()
    marcaId?:string;

    @IsOptional()
    @IsString()
    modelo?:string;

    @IsOptional()
    @IsInt()
    @Type(()=>Number)
    @Min(0)
    unidadesDis?:number;

    @IsOptional()
    @IsArray()
    etiquetas?:string[]

    @IsOptional()
    @IsIn(['any','all'])
    modoEtiquetas:'any'|'all'='any';
    
    @IsInt()
    @Type(()=>Number)
    page:number=1

    @IsInt()
    @Type(()=>Number)
    limit:number=5
}