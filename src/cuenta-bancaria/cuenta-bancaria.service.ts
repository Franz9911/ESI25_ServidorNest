import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CuentaBancaria } from './entities/cuenta-bancaria.entity';
import { Repository } from 'typeorm';
import { EmpresaService } from 'src/empresa/empresa.service';
import { PartialType } from '@nestjs/mapped-types';

@Injectable()
export class CuentaBancariaService {
  constructor(
    @InjectRepository(CuentaBancaria)
    private cuentaBanRepository:Repository<CuentaBancaria>,
    private empresaService:EmpresaService,
  ){}
  async create(dto: CreateCuentaBancariaDto) {
    const empresaExiste= await this.empresaService.buscarEmpresaPorIdInterno(dto.empresa);
    if(!empresaExiste) throw new UnauthorizedException('No se encuentra la empresa en la DB');

    const cuentaDuplicada=await this.cuentaBanRepository.findOne({
      where:{
        empresa:{
          id:empresaExiste.id,
        },
        numCuenta:dto.numCuenta,
        entidad:dto.entidad,
        //agregar al titular en la consulta
      }
    });
    if(cuentaDuplicada) throw new UnauthorizedException('No esta permitido duplicar registros de cuentas bancarias')
    const cuentaAux:Partial<CuentaBancaria>={
      estado:dto.estado,
      moneda:dto.moneda,
      entidad:dto.entidad,
      numCuenta:dto.numCuenta,
      titular:dto.titular,
      swift:dto.swift,
      iban:dto.iban,
      empresa:empresaExiste
    }
    console.log(cuentaAux);
    try {
      const cuentguardada=await this.cuentaBanRepository.save(cuentaAux);
      return {
        mensaje:'empresa registrada correctamente!!',
        data:cuentguardada
      } 
    } catch (error) {
      throw new UnprocessableEntityException('No se tiene coneccion con la DB');
    }
  }

  findAll() {
    return `This action returns all cuentaBancaria`;
  }

  async listarPorEmpresaServ(id: number) {
    const cuentas =await this.cuentaBanRepository.find({
      where:{
        empresa:{
          id:id
        }
      }
    })
    return cuentas;
  }



  async EliminarCuentaServ(id: number) {
    const cbExiste= await this.cuentaBanRepository.findOne({
      where:{id}
    })
    if(!cbExiste){
      throw new NotFoundException('No se puede acceder a la cuenta bancaria')
    }
    try {
      const reusltado=await this.cuentaBanRepository.delete(id)
      return cbExiste;
    } catch (e) {
      if(e==='23503'){
        throw new ConflictException(`Error la cuenta esta relacionada en ${e.table}`)
      }
      throw new NotFoundException('No se puede acceder al registro de cuenta bancaria')
    }
    
  }
  async ModificarCuentaBServ(id:number,dto:UpdateCuentaBancariaDto){
    const cbExiste=await this.BuscarPorIdServ(id);
    let cbAux =dto as any;
    cbAux.id=cbExiste.id;
    cbAux.fechaReg=cbExiste.fechaReg;
    console.log( typeof cbAux);
    const cbGuardada= await this.cuentaBanRepository.save(cbAux);
    return cbGuardada;
  }
  async BuscarPorIdServ(id:number){
    const cbExiste= await this.cuentaBanRepository.findOne({
      where:{ id},
      relations:['empresa']
    });
    if(!cbExiste){
      throw new NotFoundException('No se puede encontrar la cuenta bancaria')
    }
    return cbExiste;
  }
}
