import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class FindPersonaDto{
    @IsString()
    @IsOptional()
    nombre:string;
    @IsString()
    @IsOptional()
    apellidos:string;
    @IsString()
    @IsOptional()
    tipoDoc:string;
    @IsString()
    @IsOptional()
    numDoc:string;
    @IsString()
    @IsOptional()
    celular:string;
    @IsOptional()
    correoE:string;
    @IsOptional()
    fechaInicio:string;
    @IsOptional()
    fechaFin:string;
    @Min(1)
    @IsInt()
    @Type(()=>Number)
    paginaActual:number;
    @Min(5)
    @IsInt()
    @Type(()=>Number)
    datosPorPagina:number;
}