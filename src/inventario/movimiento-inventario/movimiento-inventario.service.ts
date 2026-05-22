import { Injectable } from '@nestjs/common';
import { MoviminetoInventario } from '../entities/movimiento-inventario.entity';
import { In, QueryRunner } from 'typeorm';
import { DetalleLote } from '../entities/detalle-lote.entity';
import {
  SentidoMovInventario,
  TipoMovInventario,
} from 'src/common/enums/tipo-movimiento-inventario.enum';

@Injectable()
export class MovimientoInventarioService {
    async registrarMovimiento(movimiento: MoviminetoInventario,queryRunner: QueryRunner){
        await queryRunner.manager.save(movimiento);
        console.log('dentro de movimientoInventarioService');
    }
    public async anularMovimientosInventario(tipo:TipoMovInventario,idsMovimientos: number[], LoteMap: any, queryRunner: QueryRunner){
        const movimientosReversion: MoviminetoInventario[] = [];
        const movimientos = await queryRunner.manager.find(MoviminetoInventario, {
            where: { id: In(idsMovimientos), anulado: false },
            loadRelationIds: { relations: ['producto'] },
            lock: { mode: 'pessimistic_write' },
        });
        console.log('anular movimineto inventario ', movimientos);
        for (const mov of movimientos) {
            if (mov.tipo === tipo){//evitamos doble reversion
                continue;
            }
            const itemMap = LoteMap.get(mov.id);
            const movimiento = queryRunner.manager.create(MoviminetoInventario, {
                cantidad: mov.cantidad,
                costoUnit: mov.costoUnit,
                motivo: `Reversión movimiento ${mov.id}`,
                tipo: tipo,
                anulado: true,
                sentido:mov.sentido === SentidoMovInventario.INGRESO ? SentidoMovInventario.SALIDA: SentidoMovInventario.INGRESO,
                producto: mov.producto,
                fechaAnulacion: new Date(),
                lote: { id: itemMap.lote },
                detalleLote: { id: itemMap.id },
            });
            movimientosReversion.push(movimiento);
        }
        await queryRunner.manager.save(MoviminetoInventario, movimientosReversion);
        console.log('revertidos',movimientosReversion);
        await queryRunner.manager.update(MoviminetoInventario, 
            { id: In(idsMovimientos) },
            {anulado: true,fechaAnulacion: new Date(),
        });
        console.log('origen',movimientos);
    }
}
