import { IsNumber, IsOptional, IsPositive, IsString, Length, isPositive, length, max } from "class-validator";

export class CreateClienteDto {    
    @IsNumber()
    @IsPositive()
    @IsOptional()
    persona:number; 
    @IsNumber()
    @IsPositive()
    @IsOptional()
    empresa:number; 

}
