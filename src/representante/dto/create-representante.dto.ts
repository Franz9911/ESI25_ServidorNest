import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, Length, Min } from "class-validator";

export class CreateRepresentanteDto {
    @Length(6,8)
    estado?:string;
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    empresa?:number;
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    persona?:number;
}
