import { IsDateString, IsNotEmpty, IsOptional, Length } from "class-validator";

export class CreateProveedorDto {
    @Length(6,8)
    estado:string;
    @IsOptional()
    @Length(0,256)
    condicionesPago?:string;
    @IsNotEmpty()
    empresa:number;
}
