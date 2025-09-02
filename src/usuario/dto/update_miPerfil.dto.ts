import { IsOptional, IsString, IsStrongPassword, MinLength, isString, minLength } from "class-validator";

export class UpdateMiPerfil{
    @IsStrongPassword(
        {minLength:8,minLowercase:1,minNumbers:1,minUppercase:1,minSymbols:1}
    )
    contrasenhaActual:string;
    @IsOptional()
    @IsStrongPassword(
        {minLength:8,minLowercase:1,minNumbers:1,minUppercase:1,minSymbols:1}
    )
    @MinLength(7,{message:'la contraseña debe tener mas de 8 caracteres'})
    nuevaContrasenha:string;
    @IsOptional()
    @MinLength(4,{message:'El nombre de usuario debe tener un minimo de 4 caracteres'})
    nombreU:string;
    @IsOptional()
    @IsString()
    fotografia:string;
}