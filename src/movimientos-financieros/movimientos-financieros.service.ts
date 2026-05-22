import { Injectable } from '@nestjs/common';
import { CreateMovimientosFinancieroDto } from './dto/create-movimientos-financiero.dto';
import { UpdateMovimientosFinancieroDto } from './dto/update-movimientos-financiero.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MovimientoFinanciero} from 'src/finanzas/entities/movimiento-financiero.entity';
//import { MovimientosFinancieros } from './entities/movimientos-financiero.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MovimientosFinancierosService {
  constructor(
    @InjectRepository(MovimientoFinanciero)
    private movimientoFRepository:Repository<MovimientoFinanciero>,
    
  ){}
  create(createMovimientosFinancieroDto: CreateMovimientosFinancieroDto) {
    return 'This action adds a new movimientosFinanciero';
  }

  findAll() {
    return `This action returns all movimientosFinancieros`;
  }

  findOne(id: number) {
    return this.movimientoFRepository.findOne({
      where:{
        id
      }
    });
  }

  update(id: number, updateMovimientosFinancieroDto: UpdateMovimientosFinancieroDto) {
    return `This action updates a #${id} movimientosFinanciero`;
  }

  remove(id: number) {
    return `This action removes a #${id} movimientosFinanciero`;
  }
}
