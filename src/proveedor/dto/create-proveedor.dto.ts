import { IsDateString, IsNotEmpty, IsNumber, IsOptional, Length, min } from "class-validator";

export class CreateProveedorDto {
    @Length(6,8)
    estado:string;
    @IsOptional()
    @Length(0,256)
    condicionesPago?:string;
    @IsOptional()
    @Length(3,80)
    rubro?:string;

    @IsNotEmpty()
    empresa:number;
}
