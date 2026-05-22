import { IsString, Min } from "class-validator";

export class AnularPagoDto{
    
    @IsString()
    
    motivo:string;
}