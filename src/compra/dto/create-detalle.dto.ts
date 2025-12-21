import { Type } from "class-transformer";
import { IsNumber , IsOptional} from "class-validator";

export class CreateDetalleCompra{
    @IsOptional()
    @IsNumber()
    @Type(()=>Number)
    id:number;
    @IsNumber()
    @Type(()=>Number)
    precioUnit:number;
    @IsNumber()
    @Type(()=>Number)
    unidAdquiridas:number;
    @IsNumber()
    @Type(()=>Number)
    unidDisponibles:number;
    
    //fechaRecepcion:Date;
    @IsNumber()
    @Type(()=>Number)
    precioMin:number;
    @IsNumber()
    @Type(()=>Number)
    precioMay:number;
    @IsNumber()
    @Type(()=>Number)
    idProducto:number;
    //compra:number;


}