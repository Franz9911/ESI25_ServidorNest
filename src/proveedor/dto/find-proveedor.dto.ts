import { Type } from "class-transformer";
import { IsDate, IsDateString, IsInt, IsOptional, Length, Min } from "class-validator";

export class FindProveedorDto{
    @IsOptional()
    @Length(0,8)
    estado:string;
    @IsOptional()
    rubro:string;
    @IsOptional()
    nombreEmpresa:String;
    @IsOptional()
    @Type(()=>Number)
    nitEmpresa:number;
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