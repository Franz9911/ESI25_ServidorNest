import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Length, ValidateNested } from "class-validator";
import { CreateDetalleCompra } from "./create-detalle.dto";
//import { CreatePlanPagoCompraDto2 } from "./create-plan-pago-compra.dto";

import { CreateCotizacionDto } from "./create-cotizacion.dto";
import { CreatePlanPagoDto } from "src/cuentas/dto/create-plan-pago.dto";
import { CreatePagoDto } from "src/finanzas/dto/create-pago.dto";
import { CreateMovimientoFinancieroDto2 } from "src/finanzas/dto/movimiento-financiero.dto";
export class CreateCompraDto {
    @IsString()
    @IsOptional()
    estadoRec:string;
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    idProveedor:number;
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    idRepresentante:number;
    @IsOptional()
    @IsString()
    tipo:string;
    @IsOptional()
    observacion?:string;
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateDetalleCompra)
    detalle: CreateDetalleCompra[];

    @IsOptional()
    @ValidateNested()
    @Type(() => CreatePlanPagoDto)
    plan: CreatePlanPagoDto;

    @IsOptional()
    @ValidateNested()
    @Type(()=>CreateCotizacionDto)
    cotizaciones:CreateCotizacionDto[];

    @IsOptional()
    @ValidateNested({each:true})
    @Type(()=>CreateMovimientoFinancieroDto2)
    movimientos?:CreateMovimientoFinancieroDto2[];
}
