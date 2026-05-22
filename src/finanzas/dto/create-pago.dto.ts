import { Type } from "class-transformer";
import { IsArray, IsDate, IsNumber, IsOptional, IsPositive, IsString, Length, ValidateNested } from "class-validator";
import { CreateMovimientoFinancieroDto2 } from "./movimiento-financiero.dto";
//import { CreateMovimientosFinancieroDto } from "src/movimientos-financieros/dto/create-movimientos-financiero.dto";
//import { MovimientosFinancieros } from "src/movimientos-financieros/entities/movimientos-financiero.entity";

export class CreatePagoDto{
    
    @IsNumber()
    @Type(()=>Number)
    @IsOptional()
    montoOperacion:number;
    @IsString()
    @IsOptional()
    monedaOperacion:string;
    @IsPositive()
    @IsOptional()
    montoML:number;
    @IsNumber()
    @Type(()=>Number)
    @IsOptional()
    recargoMora:number;
    @IsNumber()
    @Type(()=>Number)
    tipoCambio:number;

    @IsString()
    @IsOptional()
    estado:string;
    @IsString()
    @IsOptional()
    concepto:string;

    @IsNumber()
    @Type(()=>Number)
    idCuota:number;

    @IsNumber()
    @Type(()=>Number)
    idPlan:number;
    @IsArray()
    @ValidateNested()
    @Type(()=>CreateMovimientoFinancieroDto2)
    movimientosF:CreateMovimientoFinancieroDto2[];
}