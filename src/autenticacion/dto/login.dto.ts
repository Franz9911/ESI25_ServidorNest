import { IsString, Min, MinLength, isString } from "class-validator";

export class LoginDto{
    @IsString()
    nombreU:string;
    @IsString()
    contrasenha:string;
}