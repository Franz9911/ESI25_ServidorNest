import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Length, MaxLength } from "class-validator";
import { EstadoVenta, TipoVenta } from "src/common/enums/venta.enum";



export class FindVentaDto{
    @IsString()
    @IsOptional()
    @MaxLength(100)
    nombreCliente:string;
    @IsString()
    @IsOptional()
    @IsEnum(TipoVenta)
    tipo:string;
    @IsString()
    @MaxLength(7)
    @IsOptional()
    tipoCliente:string;
    @IsString()
    @IsOptional()
    @IsEnum(EstadoVenta)
    estado:string;
    @IsString()
    fechaInicio:string;
    @IsString()
    fechaFin:string;
    @IsNumber()
    @Type(()=>Number)
    datosPorPagina:number;
    @IsNumber()
    @Type(()=>Number)
    paginaActual
}