import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, Length } from "class-validator";

export class CreatePlanPagoCompraDto{
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    id:number;
    @IsNumber()
    @Type(()=>Number)
    numCuotas:number;
    @Length(1,6)
    frecuencia:string;
    @IsNumber()
    @Type(()=>Number)
    montoTotalML:number;
    @IsNumber()
    @Type(()=>Number)
    montoTotalOperacion:number;
    @IsNumber()
    @Type(()=>Number)
    tipoCambio:number
    @Length(3,4)
    @IsNotEmpty()
    monedaOperacion:string;
    @IsNotEmpty()
    fechaInicio:Date;
    @IsNotEmpty()

    estado:string;
    
} 