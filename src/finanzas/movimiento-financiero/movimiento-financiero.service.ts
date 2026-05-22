import { BadRequestException, Injectable, NotAcceptableException } from '@nestjs/common';
import { In, QueryRunner } from 'typeorm';
import { Pago } from '../entities/pago.entity';
import { CreateMovimientoFinancieroDto2 } from '../dto/movimiento-financiero.dto';
import { MovimientoFinanciero } from '../entities/movimiento-financiero.entity';
import { TipoMovimientoFinanciero } from 'src/common/enums/tipo-movimento-financiero.enum';

@Injectable()
export class MovimientoFinancieroService {
    //los pago solo se registra en BOB;

    public async registrarMovimientos(pago:Pago, movimientos:CreateMovimientoFinancieroDto2[], queryRunner:QueryRunner){
        if(!movimientos?.length){
            throw new BadRequestException('Debe agregar moviminetos financieros');
        }
        //falta la cuenta financiera
        let total:number=0;
        //de momento estamos trabajando soo con pago en bolivianos en venta
        const entidades =movimientos.map(item=>{
            const tipoCambio:number=pago.tipoCambio ?? 1;
            const montoML:number = Number((item.monto* tipoCambio).toFixed(2));
            total+=montoML;
            console.log("mov f: ",total);
            return queryRunner.manager.create(MovimientoFinanciero,{
                moneda:item.moneda, 
                //monto:item.monto,
                tipoMov:item.tipoMov,
                metodoPago:item.metodoPago,
                concepto:item.concepto,
                //tipoCambio,
                montoML,  
                pago,  
            });
            
        })
        //aqui no aplican ni intereses ni moras
        const diferencia = Math.abs(total-pago.montoML);
        if(diferencia>0.01){
            throw new NotAcceptableException(`El total de los movimientos ${total} es diferente al total del pago ${pago.montoML}`)            
        }
        //console.log('total mov: ',totalMovimientos , 'monto pago',pago.montoML)
        await queryRunner.manager.save(entidades);

    }
    //Revertir todos los moviminetos financieros de una venta, compra? anulado/a
    public async revertirMovimientosTotal(pagos:Pago[],queryRunner:QueryRunner){
      console.log('movimientos financieros serv');
      if(pagos.length===0){
        return;
      }
      const idPagos = pagos.map(p => p.id); 
      const movimientos = await queryRunner.manager.find(MovimientoFinanciero,{
        where:{
          pago:{id: In(idPagos)},
          movOrigen:true,
        },
        loadRelationIds:{relations:['pago']
        },
        lock:{ mode:'pessimistic_write'}
      });
      const pagoMap = new Map(pagos.map(p => [p.id, p])); //map de pagos
      const movimetosInversos: MovimientoFinanciero[] = [];
      for (const item of movimientos) {
        //si el movimieto original ya esta revertido, no se debe tomar en cuenta para crear un mov inverso 
        if(item.movRevertido===false){  
          const pago= pagoMap.get(Number(item.pago));
          item.movRevertido=true; //marcamos al mov original como revertido
          let movInverso:TipoMovimientoFinanciero;
          if(item.tipoMov===TipoMovimientoFinanciero.INGRESO){ //invertir el tipo de movimiento
            movInverso=TipoMovimientoFinanciero.EGRESO;
          }else{
            movInverso=TipoMovimientoFinanciero.INGRESO;
          }
          //creamos los movimientos inversos
          const reverso =queryRunner.manager.create(MovimientoFinanciero,{
              tipoMov:movInverso,
              metodoPago:item.metodoPago,
              monto:item.monto, 
              montoML:item.montoML,
              concepto:`Reverso pago #${pago.id}`,
              movimientoOriginalId:item.id,
              movOrigen:false,
              movRevertido:true, //ya no se puede revertir
              pago:pago
     
            });
            movimetosInversos.push(reverso);
        }
        
        
      }
      await queryRunner.manager.save(movimetosInversos);//guardar en DB los mov invertidos
      await queryRunner.manager.save(movimientos);//actualizar los mov originales
    }
    //revertir los movimintos financieros de una pago unico
    public async revertirMovimientosFinancieros(movimientos:MovimientoFinanciero[],pago:Pago, queryRunner:QueryRunner){
      const totalReversos=[];  
      for(const mov of movimientos){
            let movInverso:TipoMovimientoFinanciero;
            if(mov.tipoMov===TipoMovimientoFinanciero.INGRESO){
              movInverso=TipoMovimientoFinanciero.EGRESO;
            }else{
              movInverso=TipoMovimientoFinanciero.INGRESO;
            }
            mov.movRevertido=true;
            const reverso =queryRunner.manager.create(MovimientoFinanciero,{
              tipoMov:movInverso,
              metodoPago:mov.metodoPago,
              monto:mov.monto, 
              montoML:mov.montoML,
              movOrigen:false,
              movRevertido:true,
              concepto:`Reverso pago #${pago.id}`,
              movimientoOriginalId:mov.id,
              pago:pago
     
            });
            totalReversos.push(reverso);
          }
          await queryRunner.manager.save(totalReversos);
          await queryRunner.manager.save(movimientos); //esta es la linea 118
            console.log("movimientos ", movimientos);
    }
}
