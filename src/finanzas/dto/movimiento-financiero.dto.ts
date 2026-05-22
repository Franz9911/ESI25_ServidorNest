import { Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, isNotEmpty } from "class-validator";
import { Moneda } from "src/common/enums/moneda.enum";
import { MetodoPagoMovimientoF, TipoMovimientoFinanciero } from "src/common/enums/tipo-movimento-financiero.enum";

export class CreateMovimientoFinancieroDto2 {
    @IsEnum(TipoMovimientoFinanciero)
    tipoMov:TipoMovimientoFinanciero;

    @IsString()
    @IsOptional()
    referencia:string;

    @IsNotEmpty()
    @IsEnum(MetodoPagoMovimientoF)
    metodoPago:MetodoPagoMovimientoF;
    
    @IsNotEmpty()
    @IsEnum(Moneda)
    moneda:Moneda;

    @IsNumber()
    @Type(()=>Number)
    monto:number;

    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    tipoCambio:number;

    @IsNumber()
    montoML:number;
    
    @IsString()
    concepto:string;
    
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    IdPago:number;

    @IsNumber()
    @IsOptional()
    idCuenta:number; //id de cuenta
}
