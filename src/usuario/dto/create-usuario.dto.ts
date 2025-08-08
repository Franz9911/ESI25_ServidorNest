import { Allow, IsNotEmpty, IsString, IsStrongPassword, Min, MinLength, isNotEmpty } from "class-validator";
import { CreatePersonaDto } from "src/persona/dto/create-persona.dto";
import { Persona } from "src/persona/entities/persona.entity";

export class CreateUsuarioDto {
    @IsString()
    @MinLength(4,{message:'El nombre de usuario debe tener un minimo de 4 caracteres'})
    nombreU:string;
    @IsStrongPassword(
        {minLength:8,minLowercase:1,minNumbers:1,minUppercase:1,minSymbols:1}) 
    contrasenha:string;
    @MinLength(4,{message:'El rol no puede estar vacio'})
    rol:string;
    @Allow()
    fotografia:string;
    @MinLength(3)
    estado:string;
    //persona datos
    @IsNotEmpty()
    persona:CreatePersonaDto;
    

}
