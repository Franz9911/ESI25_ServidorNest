import { PartialType } from '@nestjs/mapped-types';
import { CreateCompraDto } from './create-compra.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateDetalle } from './update-detalle.dto';
import { CreatePlanPagoDto } from 'src/cuentas/dto/create-plan-pago.dto';

export class UpdateCompraDto {
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    id:number;
    @IsOptional()
    fechaReg:string;
    @IsString()
    tipo:string; // agregar el tipo
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
    fechaAnulacion:string;
    @IsOptional()
    motivoAnulacion:Date;
    @IsOptional()
    plan :CreatePlanPagoDto;
    @IsOptional()
    @Type(() => UpdateDetalle)
    detalles:UpdateDetalle[];
    @IsOptional()
    cotizaciones:any;
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    subTotal:number;
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    impuestoTotal:number;
}
