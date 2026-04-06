import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

export class CreateDetalleDevolucionCompraDto{
    @IsNumber()
    @Type(()=>Number)
    unidadesDev:number;
    @IsNumber()
    @Type(()=>Number)
    idLote:number;
    @IsNumber()
    @Type(()=>Number)
    idDetalleCompra:number;
    
}