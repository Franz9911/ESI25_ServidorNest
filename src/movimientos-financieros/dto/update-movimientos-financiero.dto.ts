import { PartialType } from '@nestjs/mapped-types';
import { CreateMovimientosFinancieroDto } from './create-movimientos-financiero.dto';

export class UpdateMovimientosFinancieroDto extends PartialType(CreateMovimientosFinancieroDto) {}
