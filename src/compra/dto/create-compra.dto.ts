import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Length, ValidateNested } from "class-validator";
import { CreateDetalleCompra } from "./create-detalle.dto";
//import { CreatePlanPagoCompraDto2 } from "./create-plan-pago-compra.dto";
import { CreatePlanPagoCompraDto } from "./create-plan-pago-compra.dto";
import { CreateCotizacionDto } from "./create-cotizacion.dto";
export class CreateCompraDto {
    @IsString()
    estadoRec:string;
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    idProveedor:number;

    @IsOptional()
    observacion?:string;
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateDetalleCompra)
    detalle: CreateDetalleCompra[];

    @IsOptional()
    @ValidateNested()
    @Type(() => CreatePlanPagoCompraDto)
    plan: CreatePlanPagoCompraDto;

    @IsOptional()
    @ValidateNested()
    @Type(()=>CreateCotizacionDto)
    cotizaciones:CreateCotizacionDto[];
}
