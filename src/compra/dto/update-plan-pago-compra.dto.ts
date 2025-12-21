import { IsNumber, IsOptional } from "class-validator";
import { CreatePlanPagoCompraDto } from "./create-plan-pago-compra.dto";
import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
export class UpdatePlanPagoCompraDto extends PartialType(CreatePlanPagoCompraDto){
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    id?: number;
}