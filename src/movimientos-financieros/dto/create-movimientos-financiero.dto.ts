import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateMovimientosFinancieroDto {
    @IsString()
    @IsOptional()
    tipoM:string;
    @IsNumber()
    montoML:number;
    @IsString()
    concepto:string;
    @IsString()
    @IsOptional()
    estado:string;
    @IsString()
    @IsOptional()
    referencia:string;
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    monto:number;
    @IsString()
    @IsOptional()
    moneda:string;
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    tipoCambio:number;
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    IdPago:number;
    @IsString()
    cuenta:string; //id de cuenta

}
