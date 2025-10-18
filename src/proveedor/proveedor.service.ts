import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
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
      estado:dto.estado,
      calificacion:0,
      rubro:dto.rubro
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
    const {nombreEmpresa,nitEmpresa,estado,rubro,fechaInicio,fechaFin}=dto
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
    if(estado!==''){
      query.andWhere('proveedor.estado = :estado',{estado});
    } 
    if(rubro){
      query.andWhere('proveedor.rubro = :rubro',{rubro});
    }
    query.orderBy('proveedor.empresa','ASC');
    query.skip((dto.paginaActual-1)* dto.datosPorPagina).take(dto.datosPorPagina);
    const [data,totalItems]=await query.getManyAndCount();
    return {
      totalItems,
      data
    }
  }

  async Imprimir(dto:FindProveedorDto): Promise<PaginacionResultado<Proveedor>>{
    const {nombreEmpresa,nitEmpresa,estado,rubro,fechaInicio,fechaFin}=dto
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
    if(rubro){
      query.andWhere('proveedor.rubro = :rubro',{rubro});
    } 
    query.orderBy('proveedor.empresa','ASC');
    //query.skip((dto.paginaActual-1)* dto.datosPorPagina).take(dto.datosPorPagina);
    const [data,totalItems]=await query.getManyAndCount();
    return {
      totalItems,
      data
    }
  }

  async buscarProveedorPorId(id: number) {
    const empresaProveedor= await this.proveedorRepository.findOne({
      where:{id,
      },relations:['empresa','empresa.representantes.persona','empresa.cuentasBancarias']
    })
    return empresaProveedor;
  }

  async ModifcarProveedorServ(id: number, dto: UpdateProveedorDto) {
    const proveedorExiste =await this.proveedorRepository.findOne({
      where:{id}
    });
    if(!proveedorExiste){
      throw new NotFoundException('No se puede encontra el registro de proveedor');
    }
    try {
      Object.assign(proveedorExiste,dto);
      const resultado= await this.proveedorRepository.save(proveedorExiste);
      return resultado;
    } catch (error) {
      throw new InternalServerErrorException('Error al registrar los cambios en proveedor')
    }

    
    return proveedorExiste;
  }

  async EliminarProveedorServ(id: number) {
    const proveedorExiste=await this.proveedorRepository.findOne({
      where:{id},relations:['empresa']
      //relacion con compras si el array compras esta vacio eliminar proveedor
    });
    if(!proveedorExiste){
      //error para cunado no se encentra un recurso 
      throw new NotFoundException('No se encuentra al proveedor!!');
    }
    try {
      await this.proveedorRepository.delete({id});
      return {mensaje:'Proveedor Elimando correctamente'};
    } catch (error) {
      if (error.code === '23503') { // Código de violación de clave foránea en Postgres
        throw new ConflictException('No se puede eliminar el proveedor porque tiene registros relacionados.');
      }
      throw new InternalServerErrorException('Error al eliminar el proveedor');
    }  
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
