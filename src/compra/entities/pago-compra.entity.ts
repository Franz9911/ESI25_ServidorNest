import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { MovimientoFinanciero } from "src/finanzas/entities/movimiento-financiero.entity";
//import { CuotaCompra } from "./cuota-compra.entity";
import { EstadoPago } from "src/common/enums/estado-pago.enum";
import { Comprobante } from "./comprobante.entity";
/*@Entity()
export class PagoCompra{
    @PrimaryGeneratedColumn('increment')
    id:number;

    @Column({comment:'metodo de pago usado para la tranferir el dinero'})
    metodoPago!:string;

    @Column({comment:'moneda de la operacion ejem. BOB,USD,'})
    monedaOperacion!:string;
    
    @Column({type:'decimal',precision:10,scale:4,
    comment:'tipo de cambio'})
    tipoCambio!:number;

    @Column({type:'decimal',precision:12,scale:2,
        comment:'monto que se pagara en este registro'})
    montoOperacion!:number;
    
    @Column({type:'decimal',precision:12,scale:2,
        comment:'monto a pagar en moneda local'})
    montoML!:number;
    
    @Column({type:'decimal',precision:12,scale:2, default:0,
        comment:'recargos al pago por conceto de retraso en la fecha definida'})
    recargoMora!:number;
    
    @Column({comment:'numero de comprobante de pago enmitido por el proveedor'})
    numFactura?:string; 
    
    @Column({default:EstadoPago.REGISTRADO, comment:'estado del pago: activo o anulado'})
    estado?:string;
    
    // este concepto debe ser ingresado por el cliente.
    @Column({comment:'Descripcion del motivo de pago: ejemp. anticipo o pago de cuoto por la adquisicion de euipos elecctronicos'})
    concepto?:string;
    //fechaPago
    //id de movimientosde cuenta 
    
    //@OneToMany(()=>MovimientoFinanciero,movimientos=>MovimientoFinanciero.pagoCompra)
    //movimientos?:MovimientoFinanciero[];

    @OneToOne(()=>CuotaCompra,cuota =>(cuota.pago))
    cuota:CuotaCompra;
    @OneToMany(()=>Comprobante, comprobantes => comprobantes.pago,{cascade:true})
    comprobantes:Comprobante[];
}*/