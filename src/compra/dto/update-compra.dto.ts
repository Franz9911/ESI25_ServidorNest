import { PartialType } from '@nestjs/mapped-types';
import { CreateCompraDto } from './create-compra.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdatePlanPagoCompraDto } from './update-plan-pago-compra.dto';
import { UpdateDetalle } from './update-detalle.dto';

export class UpdateCompraDto {
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    id:number;
    @IsOptional()
    fechaReg:string;
    @IsOptional()
    folder:string;
    @IsString()
    estadoRec:string;
    @IsOptional()
    observaciones:string;
    @IsNumber()
    @Type(()=>Number)
    idProveedor:number;
    @IsOptional()
    plan:UpdatePlanPagoCompraDto;
    @IsOptional()
    @Type(() => UpdateDetalle)
    detalles:UpdateDetalle[];
    @IsOptional()
    cotizaciones:any;
}
