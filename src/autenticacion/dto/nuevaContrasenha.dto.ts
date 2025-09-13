import { IsEmail, IsNumberString, IsStrongPassword, Length, MaxLength, MinLength, length, minLength } from "class-validator";

export class NuevaContrasenhaDto{
    @IsEmail()
    email:string;
    @Length(6,6,{message:'El codigo no es valido'})
    //@IsNumberString()
    codigo:string;
    @IsStrongPassword({minLength:8,minNumbers:1,minUppercase:1,minSymbols:1,minLowercase:1})
    nuevaContrasenha:string;
    
}