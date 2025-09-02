import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString } from "class-validator";

export class buscarMarcaDto{ 
    @IsOptional()
    @IsString()
    nombre?:string;

    @IsInt()
    @Type(()=>Number)
    page:number=1

    @IsInt()
    @Type(()=>Number)
    limit:number=5
}