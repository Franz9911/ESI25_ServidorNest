import { IsDate, IsNumber, IsOptional, IsString, isDate } from "class-validator";
import { Type } from "class-transformer";
export class BuscarCotizacionDto{
    @IsOptional()
    @IsString()
    razonSocial:string;
    @IsOptional()
    fechaInicio:string;
  
    @IsOptional()
    fechaFin:string;
    @IsOptional()
    @IsString()
    repreNombre:string;
    @IsOptional()
    @IsString()
    repreApellidos:string;
    @IsOptional()
    folder:string;
    @IsNumber()
    @Type(()=>Number)
    paginaActual:number;
    @IsNumber()
    @Type(()=>Number)
    datosPorPagina:number;
}