import { Type } from "class-transformer";
import { IsArray, IsDate, IsNumber, IsOptional, IsPositive, IsString, Length, ValidateNested } from "class-validator";
import { CreateMovimientosFinancieroDto } from "src/movimientos-financieros/dto/create-movimientos-financiero.dto";
//import { MovimientosFinancieros } from "src/movimientos-financieros/entities/movimientos-financiero.entity";

/*export class CreatePagoCompraDto{
    @IsNumber()
    @Type(()=>Number)
    montoOperacion:number;
    @IsString()
    monedaOperacion:string;
    @IsPositive()
    montoML:number;
    @IsNumber()
    @Type(()=>Number)
    recargoMora:number;
    @IsNumber()
    @Type(()=>Number)
    tipoCambio:number;
    @IsString()
    metodoPago:string;
    @IsString()
    numFactura:string;
    @IsString()
    estado:string;
    @IsString()
    concepto:string;
    @IsString()
    @IsOptional()
    motivoAnulacion:string;
    @IsOptional()
    @IsDate()
    fechaAnulacion:Date;
    @IsArray()
    @ValidateNested()
    @Type(()=>CreateMovimientosFinancieroDto)
    movimientos:CreateMovimientosFinancieroDto[];


}*/