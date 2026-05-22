import { Type } from "class-transformer";
import { IsDate, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateMovimientoInventarioDto {
    @IsNumber()
    @Type(()=>Number)
    @Min(1)
    unidadesIni:number;
    @IsDate()
    @Type(() => Date)
    fechaIngreso:Date;
    @IsString()
    @IsOptional()
    observaciones:string;
    @IsString()
    @IsOptional()
    motivo:string;
    @IsNumber()
    @Type(()=>Number)
    idProducto:number;
    @IsNumber() 
    @Type(()=>Number)
    idDetalleCompra:number;
    @IsNumber() 
    @Type(()=>Number)
    @IsOptional()
    idPlanPago:number;
}