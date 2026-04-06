import { Injectable } from '@nestjs/common';
import { MoviminetoInventario } from '../entities/movimiento-inventario.entity';
import { QueryRunner } from 'typeorm';

@Injectable()
export class MovimientoInventarioService {
    async registrarMovimiento(movimiento:MoviminetoInventario, queryRunner:QueryRunner){
        await queryRunner.manager.save(movimiento);
        console.log('dentro de movimientoInventarioService')  
    }
}
