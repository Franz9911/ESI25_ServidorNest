import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { type } from "os";
import { CreateMovimientoInventarioDto } from "src/inventario/dto/create-movimiento-inventario.dto";
import { CreateMovimientosFinancieroDto } from "src/movimientos-financieros/dto/create-movimientos-financiero.dto";
import { DetalleDevolucionCompra } from "../entities/detalle-devolucion-compra.entity";
import { CreateDetalleDevolucionCompraDto } from "./create-detalle-devolucion.dto";

export class CreateDevolucionCompraDto{
    //movimientosF:CreateMovimientosFinancieroDto[];
    //moviminetosI:CreateMovimientoInventarioDto[];
    @IsString()
    motivo:string;
    @IsNumber()
    @Type(()=>Number)
    idCompra:number;
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    montoTotalDev:number;
    @IsOptional()
    @ValidateNested({each:true})
    @Type(()=>CreateDetalleDevolucionCompraDto)
    detallesDev:CreateDetalleDevolucionCompraDto;

}