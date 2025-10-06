import { BadRequestException, ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateRepresentanteDto } from './dto/create-representante.dto';
import { UpdateRepresentanteDto } from './dto/update-representante.dto';
import { Repository } from 'typeorm';
import { Representante } from './entities/representante.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EmpresaService } from 'src/empresa/empresa.service';
import { PersonaService } from 'src/persona/persona.service';

@Injectable()
export class RepresentanteService {
  constructor(
    @InjectRepository(Representante)
    private representanteRepository:Repository<Representante>,
    private empresaService:EmpresaService,
    private personaService:PersonaService,
  ){}
  async create(dto: CreateRepresentanteDto) {
    console.log(dto);
    const empresaExiste=await this.empresaService.buscarEmpresaPorId(dto.empresa);
    if(!empresaExiste) throw new UnauthorizedException('No se pede encontrar la empresa');
    const personaExiste= await this.personaService.buscarPorId(dto.persona);
    if(!personaExiste) throw new UnauthorizedException('la persona no existe')
    //prevenir duplicad de registro
    const representanteDuplicado=await this.representanteRepository.findOne({
      where:{
        persona:{id:personaExiste.id},
        empresa:{id:empresaExiste.id}
      }
    });
    if(representanteDuplicado){
      throw new ConflictException('No se puede duplicar el registro de representantes')
    }
    const representanteAux:Partial<Representante>={
      estado:dto.estado,
      persona:personaExiste,
      empresa:empresaExiste
    }
    try {
      const representanteGuardado=await this.representanteRepository.save(representanteAux);
      return {
        mensaje:'Representate Registrado correctamente!!',
        data:representanteGuardado,
      }
    } catch (error) {
      throw new BadRequestException('No se puede conectar a la DB')
    }
  }

  findAll() {
    return `This action returns all representante`;
  }

  async representantesPorEmpresa(id: number) {
    return `This action returns a #${id} representante`;
  }

  update(id: number, updateRepresentanteDto: UpdateRepresentanteDto) {
    return `This action updates a #${id} representante`;
  }

  remove(id: number) {
    return `This action removes a #${id} representante`;
  }
}
