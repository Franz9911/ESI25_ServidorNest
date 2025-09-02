import { IsString, MinLength } from "class-validator";

export class CreateMarcaDto {
    @IsString()
    @MinLength(2,{message:'el nombre es requerido.'})
    nombre:string
}
