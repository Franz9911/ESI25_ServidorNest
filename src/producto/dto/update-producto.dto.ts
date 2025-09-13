import { PartialType } from '@nestjs/mapped-types';
import { CreateProductoDto } from './create-producto.dto';
import { IsNotEmpty, IsOptional, IsString, Min } from 'class-validator/types/decorator/decorators';

export class UpdateProductoDto extends PartialType(CreateProductoDto) {
}

 