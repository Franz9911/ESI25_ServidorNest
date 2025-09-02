import { Injectable } from '@nestjs/common';
import { CreateRegistroActividadDto } from './dto/create-registro-actividad.dto';
import { UpdateRegistroActividadDto } from './dto/update-registro-actividad.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RegistroActividad } from './entities/registro-actividad.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RegistroActividadService {
  constructor(
    @InjectRepository(RegistroActividad)
    private raRepository:Repository<RegistroActividad>
  ){}
  async create(registro: any) {
    console.log("estams creando el registro")
    const registroGuardado=await this.raRepository.save(registro);
        
    return registroGuardado;
  }

  findAll() {
    return `This action returns all registroActividad`;
  }

  findOne(id: number) {
    return `This action returns a #${id} registroActividad`;
  }

  update(id: number, updateRegistroActividadDto: UpdateRegistroActividadDto) {
    return `This action updates a #${id} registroActividad`;
  }

  remove(id: number) {
    return `This action removes a #${id} registroActividad`;
  }
}
