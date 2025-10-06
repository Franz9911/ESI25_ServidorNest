import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { EmpresaService } from 'src/empresa/empresa.service';
import { FindProveedorDto } from './dto/find-proveedor.dto';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';

@Injectable()
export class ProveedorService {
  constructor(
    @InjectRepository(Proveedor)
    private proveedorRepository:Repository<Proveedor>,
    private empresaService:EmpresaService,
    ){}
  async crearProveedorServ(dto: CreateProveedorDto) {
    const empresaExiste= await this.empresaService.buscarEmpresaPorId(dto.empresa);
    //let proveedorDuplicada:Proveedor;
    if(!empresaExiste){
      throw new NotFoundException('La empresa no existe en la DB');
    }
    const proveedorExiste= await this.buscarEmpresaProveedor(empresaExiste.id);
    if(proveedorExiste){
      throw new UnprocessableEntityException('Ya Existe un proveedor registrado con la empresa ingresada');
    }

    const proveedorAux:Partial<Proveedor>={
      condicionesPago:dto.condicionesPago,
      empresa:empresaExiste,
      estado:dto.estado
    }
    try{
      const proveedorGuardado= await this.proveedorRepository.save(proveedorAux);
      return {
        mensaje:'Proveedor registrado correctamente!!',
        data:proveedorGuardado,
      }
    } catch(error){
      throw new BadRequestException('Error al guardar el proveedor en la DB')
    }  
  }

  async buscarEmpresaProveedorServ(dto:FindProveedorDto): Promise<PaginacionResultado<Proveedor>>{
    const {nombreEmpresa,nitEmpresa,estado,fechaInicio,fechaFin}=dto
    let fechaIn: Date | null = null;
    let fechaFi: Date | null = null;
    const query =this.proveedorRepository.createQueryBuilder('proveedor');
    query.leftJoinAndSelect('proveedor.empresa','empresa');
    if(fechaInicio!=''&& fechaInicio!='undefined'){
      fechaIn=new Date(`${fechaInicio} 00:00:00`)
      if(fechaFin!=''&& fechaFin!='undefined'){
        fechaFi=new Date(`${fechaFin} 23:59:59`);
      }else{
        fechaFi=new Date(`${fechaInicio} 23:59:59`)
      }
      query.andWhere('proveedor.fechaReg BETWEEN :fechaIn AND :fechaFi', {
        fechaIn,
        fechaFi,
      });
    }
    if(nombreEmpresa){
      query.andWhere('LOWER(empresa.razonSocial) LIKE LOWER(:razonSocial)', {
        razonSocial: `%${nombreEmpresa}%`
      });
      query.distinct(true);
    } 
    if(nitEmpresa ){
      query.andWhere('empresa.numDoc = :nitEmpresa',{nitEmpresa});
    }
    if(estado){
      query.andWhere('proveedor.estado = :estado',{estado});
    } 
    query.orderBy('proveedor.empresa','ASC');
    query.skip((dto.paginaActual-1)* dto.datosPorPagina).take(dto.datosPorPagina);
    const [data,totalItems]=await query.getManyAndCount();
    return {
      totalItems,
      data
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} proveedor`;
  }

  update(id: number, updateProveedorDto: UpdateProveedorDto) {
    return `This action updates a #${id} proveedor`;
  }

  remove(id: number) {
    return `This action removes a #${id} proveedor`;
  }
   async buscarEmpresaProveedor(idEmpresa){
    const empresaProveedor= await this.proveedorRepository.findOne({
      where:{
        empresa:{ id:idEmpresa}
      }
    })
    return empresaProveedor;
   }
}
