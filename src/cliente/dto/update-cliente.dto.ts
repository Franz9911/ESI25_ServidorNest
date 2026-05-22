import { PartialType } from '@nestjs/mapped-types';
import { CreateClienteDto } from './create-cliente.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateClienteDto extends PartialType(CreateClienteDto) {
    @IsString()
    @IsOptional()
    estado:string;
    @IsNumber()
    @Type(()=>Number)
    @IsOptional()
    
    puntosAcumulados:number

}
