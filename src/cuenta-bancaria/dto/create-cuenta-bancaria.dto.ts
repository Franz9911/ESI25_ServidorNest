import { IsOptional, Length, Min } from "class-validator";

export class CreateCuentaBancariaDto {
    @Length(6,8)
    estado?:string;
    @Length(3,80)
    titular?:string;
    @Length(2)
    moneda!:string;
    @Length(8,30)
    numCuenta!:string;
    @Length(9)
    entidad?:string;
    @Length(3,30)
    @IsOptional()
    swift:string
    @Length(3,30)
    @IsOptional()
    iban:string;
    @Min(1)
    empresa:number;


}
