import { PartialType } from "@nestjs/mapped-types";
import { CreateCotizacionDto } from "./create-cotizacion.dto";

export class ActualizarCotizacionDto extends PartialType(CreateCotizacionDto){

}