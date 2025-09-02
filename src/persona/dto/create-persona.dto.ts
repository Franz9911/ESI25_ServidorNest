import { IsNumber,MinLength,IsAlpha, Min, Allow, Matches, IsOptional, minLength, MaxLength } from "class-validator";

export class CreatePersonaDto {
    @Allow()
    id:number
    @Matches(/^[A-Za-zÀ-ÿ\s]+$/, {
        message: 'El nombre solo debe contener letras y espacios',
      })
    @MinLength(3,{message:'El nombre debe deter por lo menos 3 caracteres alfabeticos'})
    nombre:string;
    @MinLength(3,{message:'El apellido debe deter por lo menos 3 caracteres alfabeticos'})
    @Matches(/^[A-Za-zÀ-ÿ\s]+$/, {
        message: 'El el apellido solo debe contener letras y espacios',
      })
    apellidos:string;
    @MinLength(2,{message:'Debe seleccionar un tipo de documento'})
    tipoDoc:string;
    @IsNumber()
    @Min(99999,{message:'El numero de documento debe tener 6 digitos o mas'})
    numDoc:number;
    direccion:string;
    @IsNumber()
    @Min(60000000,{message:'debe ingresara un numero de celular'})
    celular:number;
    @IsOptional()
    @MinLength(12,{message:'el correo electronico debe tener un minimo de 12 caracteres'})
    @MaxLength(100)
    correoE:string;
    @IsOptional()
    fechaNac:Date;
    //fechaReg:Date;
}
