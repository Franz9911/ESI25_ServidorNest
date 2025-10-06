import { Type } from "class-transformer";
import { IsEmail, IsNotEmpty, IsNotEmptyObject, IsNumber, IsOptional, IsString, IsUrl, Length } from "class-validator";
import { Persona } from "src/persona/entities/persona.entity";
import { Proveedor } from "src/proveedor/entities/proveedor.entity";

export class CreateEmpresaDto {
   @Length(2,80)
   @IsString()
   razonSocial:string;
   @Length(3,3)
   @IsString()
   tipoDoc:string;
   @IsNumber()
   @Type(() => Number)
   numDoc:number;
   @IsNumber()
   @Type(() => Number)
   celular:number;
   @IsOptional()
   @IsEmail()
   correoE:string;
   @IsOptional()
   @IsUrl()
   web:string;
   @Length(7,7)
   @IsString()
   tipoEmpresa:string;
   @Length(15,100)
   direccion:string;

   @IsOptional()
   proveedor:Proveedor;

}
