import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { PlanPagoService } from '../plan-pago/plan-pago.service';
import { CreatePagoCompraDto } from '../dto/create-pago.dto';
import { Compra } from '../entities/compra.entity';
import { PlanPagoCompra } from '../entities/plan-pago.entity';
import { CuotaCompra } from '../entities/cuota-compra.entity';
import { PagoCompra } from '../entities/pago-compra.entity';
import { CreateMovimientosFinancieroDto } from 'src/movimientos-financieros/dto/create-movimientos-financiero.dto';
import { MovimientosFinancieros } from 'src/movimientos-financieros/entities/movimientos-financiero.entity';
import { EstadoCompra } from 'src/common/enums/estado-compra.enum';
import { EstadoCuota } from 'src/common/enums/estado-cuota.enum';
import { EstadoPlanPago } from 'src/common/enums/estado-plan-pago.enum';
import { EstadoPago } from 'src/common/enums/estado-pago.enum';
import { Comprobante } from '../entities/comprobante.entity';

@Injectable()
export class PagoCompraService {
    constructor(
        private readonly dataSource:DataSource,
        private readonly planPagoService:PlanPagoService,
    ){}
    async registrarPago(idOC:number,idCuota:number,dto:CreatePagoCompraDto,comprobantes:Express.Multer.File[]){
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        console.log('dto: ' ,dto);
        try {
            const compra= await queryRunner.manager.findOne(Compra,{
                where:{id:idOC},relations:['planPagos'],
            });
            if(!compra){
                throw new NotFoundException('La compra no existe');
            }
            if(compra.estadoRec === EstadoCompra.COTIZACION){
                throw new ConflictException('La orden de compra no esta aprobada');
            }
            const plan = await queryRunner.manager.findOne(PlanPagoCompra,{
                where:{id:compra.planPagos.id},
                lock:{mode:'pessimistic_write'}, //bloquear la escritura, borrado , actualizado en el recurso: plan
            });
            if(!plan){
                throw new NotFoundException('La orden de compra no tiene plan de pagos');
            }
            if(plan.estado !==EstadoPlanPago.ACTIVO){
                throw new ConflictException('El plan de pago no esta activo');
            }
            const cuota = await queryRunner.manager.findOne(CuotaCompra,{
                where:{
                    id:idCuota,
                    plan:{id:plan.id},
                },lock:{mode:'pessimistic_write'}
            });
            if(!cuota){
                throw new NotFoundException('La cuota no existe');
            }

            if(cuota.estado !== EstadoCuota.PENDIENTE){
                throw new ConflictException('La cuota no puede ser pagada');
            }
            const pago = queryRunner.manager.create(PagoCompra,{
                ...dto,
                cuota,
            });
             
            if(pago.montoOperacion !== Number(cuota.monto)){
                throw new ConflictException('El monto a pagar debe ser igual al monto de la cuota mas la recarga por mora');
            }
            const pagoRegistrado= await queryRunner.manager.save(pago);
            if(!dto.movimientos?.length){
                throw new BadRequestException('Debes registrar por lo menos un movimiento financiero');
            }
            await this.registrarMoviminetos(queryRunner,dto.movimientos,pagoRegistrado)
            
            await this.planPagoService.marcarCuotaComoPagada(plan,cuota,pagoRegistrado,queryRunner)
            //esto debe estar en comprobanteService() 
            if(comprobantes?.length ){
                const imgs = comprobantes.map(file =>{
                   return queryRunner.manager.create(Comprobante,{                    
                        nombre:file.filename,
                        pago:pagoRegistrado,
                    });        
                });
                await queryRunner.manager.save(Comprobante,imgs)
            }
            await queryRunner.commitTransaction();
            return pagoRegistrado
        } catch (error) {
            console.log(error)
            throw error;
        } finally{
            await queryRunner.release();
        }    
    }

    /**
     * Objetivo: registrar la debolucion de los pagos de una compra debido a la anulacion de la compra 
     * para la devolucion se generara movimientos financieros inversos que anulara el total de los pagos realizados 
     * la devolucion puede ser total o parcial 
     * @param plan 
     * @param idOC 
     * @param queryRunner 
     */
    async registrarDevolucion(plan:PlanPagoCompra,idOC:number,movimientos:CreateMovimientosFinancieroDto[],queryRunner:QueryRunner):Promise<void>{
        //el pago de la primera cuota es el contenedor donde registramos los movimientos finacieros producto de la anulacion de una compra.
        const cuotaPagada = await queryRunner.manager.findOne(CuotaCompra,{ //buscando primer pago
            where:{ plan: { id: plan.id },estado: EstadoCuota.PAGADA,
            },relations:['pago'],order:{fechaPago: 'ASC'},
          });
          
          if (!cuotaPagada || !cuotaPagada.pago) {
            throw new ConflictException(
              'No existe un pago válido para registrar la devolución'
            );
          }
        //primer pago realizado es el contenedor de los movimientos finacieros de la devolucion 
        const PagoContenedor = await queryRunner.manager.findOne(PagoCompra,{
            where:{
                id:cuotaPagada.pago.id,
             },
            lock:{ mode:'pessimistic_write'} //garantizamos exclusion mutua 
        });
        console.log(PagoContenedor);
        //sumando el monto pagado de los movimiento que tienen tipoM=ingreso 
        const totalReembolsado = Number(await this.verMontoReembolsado(PagoContenedor.id,queryRunner));
        let montoReembolsado:number=0;
        for(const mov of movimientos){
            const montoMLAux= Number(mov.monto)*Number(mov.tipoCambio); 
            if(mov.tipoM==='ingreso'){
                montoReembolsado=montoReembolsado+mov.monto;
            }            
            mov.concepto=`devolucion de pago por anulacion de OC${idOC}`
            mov.tipoM='ingreso';
            mov.estado=EstadoPago.REGISTRADO;
            mov.moneda=plan.monedaOperacion; 
            mov.montoML=montoMLAux;
            mov.IdPago=cuotaPagada.pago.id;
        }
        console.log('reembolsado: ',montoReembolsado)
        if(montoReembolsado + totalReembolsado> Number(plan.montoTotalOperacion) - Number(plan.saldoPendiente) + Number( plan.totalRecargoMora)){
            throw new ConflictException('Estas reembolsado mas de lo que pagaste')
        }   
        await this.registrarMoviminetos(queryRunner,movimientos,PagoContenedor)
    }
    private async registrarMoviminetos(
        queryRunner:QueryRunner, movimientos:CreateMovimientosFinancieroDto[],pago:PagoCompra){
        for(const m of movimientos){
            const movimiento = queryRunner.manager.create(MovimientosFinancieros,{
                ...m,
                pagoCompra:pago,
            });
            const mr = await queryRunner.manager.save(movimiento);
        }
    }
    async verMontoReembolsado(idCuotaPagada:number, queryRunner:QueryRunner):Promise<Number>{
        console.log('id Cuota: ' ,idCuotaPagada);
        const result = await queryRunner.manager 
            .createQueryBuilder(MovimientosFinancieros, 'mov')
            .select('COALESCE(SUM(mov.monto), 0)', 'total')
            .where('mov.tipoM = :tipo', { tipo: 'ingreso' })
            .andWhere('mov.pagoCompraId = :idPago', { idPago: idCuotaPagada })
            .getRawOne();

         const totalDevuelto = Number(result.total); //contiene el total de las devoluciones 
         console.log('verTotalReem: ',totalDevuelto);
         return totalDevuelto;
    } 
}
