import {IsNumber,IsOptional,IsString,IsDateString,Min,IsEnum} from 'class-validator';
  
  export class CreatePlanPagoDto {
    @IsNumber()
    @Min(1)
    numCuotas: number;
  
    @IsOptional()
    @IsString()
    frecuencia?: string; // mensual, quincenal, etc.
    @IsString()
    fechaInicio: string;
    @IsNumber()
    @Min(0.01)
    @IsOptional()
    montoTotal: number; //monto base sin interes
    @IsString()
    moneda: string; // BOB, USD
    @IsOptional()
    @IsNumber()
    @Min(0)
    tipoCambio?: number;
    @IsOptional()
    @IsNumber()
    @Min(0)
    interes?: number; //20% solo aplica a creditos
    @IsOptional()
    @IsNumber()
    @Min(0)
    mora?: number; // Tasa de mora ej: 0.02 = 2%
    @IsOptional()
    @IsString()
    tipoMora?: string; // mensual, diario
    @IsOptional()
    @IsNumber()
    @Min(0)
    anticipo?: number; //siempre en la moneda de operacion 
  }