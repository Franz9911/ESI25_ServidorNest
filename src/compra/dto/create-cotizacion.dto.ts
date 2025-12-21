import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCotizacionDto{
    @IsOptional()
    @IsString()
    pdfRespuesta:string;
    @IsOptional()
    //@IsNumber()
    total:number;
    @IsNumber()
    idProveedor:number;
    @IsString()
    @IsOptional()
    razonSocial:string;
    @IsString()
    @IsOptional()
    nombreRepresentante:string;
    @IsNumber()
    @IsOptional()
    celularRepresentante:number;
    @IsNumber()
    idRepresentante:number;  
    @IsOptional()
    @IsNumber()
    idCompra:number;
}