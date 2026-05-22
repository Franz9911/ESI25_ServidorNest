import { Type } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";

export class FindClienteDto{
    @IsOptional()
    tipoCliente:string;
    @IsOptional()
    estado:string;
    @IsOptional()
    nombre:string;
    @IsOptional()
    fechaInicio:string;
    @IsOptional()
    fechaFin:string;
    @IsNumber()
    @Type(()=>Number)
    datosporPagina:number;
    @IsNumber()
    @Type(()=>Number)
    paginaActual:number;

}