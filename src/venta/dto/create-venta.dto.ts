import { Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { CreateDetalleVentaDto } from "./create-detalle-venta.dto";
import { TipoCliente } from "src/common/enums/tipo-cliente.enum";
import { CreatePlanPagoDto } from "src/cuentas/dto/create-plan-pago.dto";
import { CreateMovimientoFinancieroDto2 } from "src/finanzas/dto/movimiento-financiero.dto";
import { MovimientoFinancieroModule } from "src/finanzas/movimiento-financiero/movimiento-financiero.module";
import { TipoCompraVentaEnum } from "src/common/enums/tipo-compro-venta.enum";
import { TipoVenta } from "src/common/enums/venta.enum";
//import { CreateDetalleCompra } from "src/compra/dto/create-detalle.dto";

export class CreateVentaDto {
    @IsNumber()
    cliPerEmpId:number; //cliente persona o empresa id
    @IsString()
    tipoCliente:TipoCliente;
    @IsString()
    @IsOptional()
    concepto:string;
    @IsString()
    @IsOptional()
    @IsEnum(TipoVenta)
    tipo:TipoVenta;
    
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateDetalleVentaDto)
    detalles: CreateDetalleVentaDto[];   
    
    @IsNotEmpty()
    @ValidateNested({each:true})
    @Type(() => CreatePlanPagoDto)
    planPago: CreatePlanPagoDto;

    
    @IsOptional()
    @ValidateNested({each:true})
    @Type(()=>CreateMovimientoFinancieroDto2)
    movimientos?:CreateMovimientoFinancieroDto2[];

}
