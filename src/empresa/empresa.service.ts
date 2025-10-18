import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { Between, ILike, Not, Raw, Repository } from 'typeorm';
import { PersonaService } from 'src/persona/persona.service';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>, 
    private eventEmiter:EventEmitter2,  
  ){}
  async crearEmpresaServ(dto: CreateEmpresaDto) {
    const empresaExiste= await this.buscarEmpresaNIT(dto.numDoc);
    if(empresaExiste){
      throw new ConflictException(`Ya existe una Empresa con el nit ${dto.numDoc}. En el regitro de DB`);
    }
    /*const representanteLegalExiste=await this.personaService.buscarPorId(dto.representanteLegal)
    if(!representanteLegalExiste){
      throw new UnauthorizedException('No se puede encontrar el registro del representante legal')
    }*/
    const empresaAux:Partial<Empresa>={
      razonSocial:dto.razonSocial,
      celular:dto.celular,
      correoE:dto.correoE,
      tipoDoc:dto.tipoDoc,
      numDoc:dto.numDoc,
      direccion:dto.direccion,
      //representanteLegal:representanteLegalExiste,
      tipoEmpresa:dto.tipoEmpresa,
      web:dto.web
    }
    const empresaGuardada= await this.empresaRepository.save(empresaAux);
    console.log('empresa duplicada:',empresaGuardada);
    if(empresaGuardada){
      return {
        mensaje:'Empresa registrada correctamente!!',
        data:empresaGuardada
      }
    }
  }

  async buscarEmpresasServ(filtros:any) {
    let fechaIn:Date|null=null;
    let fechaFi:Date|null=null;
    if(filtros.fechaInicio!='undefined')fechaIn=new Date(`${filtros.fechaInicio} 00:00:00`);
    if(filtros.fechaFin!='undefined')fechaFi=new Date(`${filtros.fechaFin} 23:59:59`);
    else fechaFi=new Date(`${filtros.fechaInicio} 23:59:59`);
    console.log(fechaIn);
    const [data,totalItems]= await this.empresaRepository.findAndCount({
      where:{
        ...(filtros.razonSocial && { razonSocial: ILike(`%${filtros.razonSocial}%`) }),
        ...(fechaIn && fechaFi && { fechaReg: Between(fechaIn, fechaFi) }),
        
      },
      relations:['proveedor'] ,
      skip:(+filtros.paginaActual-1)*  +filtros.datosPorPagina,
      take:+filtros.datosPorPagina,
    })
    return {data,
    totalItems};
  }
  async EmpresasSinProveedorServ(razonSocial:string,nit:string,datosPorPagina:string,
    paginaActual:string):Promise<PaginacionResultado<Empresa>>{
    const query = this.empresaRepository.createQueryBuilder('empresa');
    //query.leftJoinAndSelect('empresa.representanteLegal', 'representanteLegal')
    query.leftJoin('empresa.proveedor','proveedor');
    query.andWhere('proveedor.id IS NULL');
    if(razonSocial) {
      query.andWhere('LOWER(empresa.razonSocial) LIKE LOWER(:razonSocial)', {
        razonSocial: `%${razonSocial}%`,
      });
    }
    if (nit) {
      query.andWhere('empresa.numDoc = :numDoc', { numDoc: Number(nit) });
    };
    
    query.orderBy('empresa.razonSocial','ASC');
    query.relation('representanteLegal');
    query.skip((+paginaActual-1)* +datosPorPagina);
    query.take (+datosPorPagina);
    const [data,totalItems]=await query.getManyAndCount();
    return {
      data,
      totalItems,
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} empresa`;
  }

  update(id: number, updateEmpresaDto: UpdateEmpresaDto) {
    return `This action updates a #${id} empresa`;
  }

  async EliminarEmpresaServ(id: number) {
    const EmpresaExiste= await this.empresaRepository.findOne({
      where:{id}
    });
    if(!EmpresaExiste){
      //error para cunado no se encentra un recurso 
      throw new NotFoundException('No se encuentra la Empresa!!');
    }
    try {
      await this.empresaRepository.delete({id});
      return {mensaje:'empresa Eliminada correctamente'};
    } catch (error) {
      if (error.code === '23503') { // Código de violación de clave foránea en Postgres
        console.log(error.table)
        throw new ConflictException(`No se puede eliminar la Empresa porque tiene registros relacionados con ${error.table}.`);
      }
      throw new InternalServerErrorException('Error al eliminar la Empresa');
    }
    //return EmpresaExiste;
  }
  async buscarEmpresaNIT(nit:number){
    const empresa= await this.empresaRepository.findOne({
      where:{
        numDoc:nit
      }
    })
    return empresa;
  }

  //buscar representantes por id de empresa
  async buscarEmpresaPorId(id:number){
    console.log('prueva');
    const empresaAux= await this.empresaRepository.findOne({
      where:{id:id},
      relations:['representantes','representantes.persona','cuentasBancarias'],
    });
    return empresaAux;
  }
  //funcion de uso interno sin relaciones
  async buscarEmpresaPorIdInterno(id:number){
    const empresaAux= await this.empresaRepository.findOne({
      where:{id:id},
    });
    if(!empresaAux) throw new NotFoundException('no se puede encontrar este recurso')
    return empresaAux;
  }

  async ModifcarEmpresaServ(id:number,dto,usuarioId){
    const empresaExiste= await this.buscarEmpresaPorIdInterno(id);
    if(empresaExiste.numDoc !== dto.numDoc){
      const empresaDuplicado = await this.empresaRepository.findOne({
        where:{
          tipoDoc:dto.tipoDoc,
          numDoc:dto.numDoc,
          id:Not(id)
        }
      });
      if(empresaDuplicado){
        throw new ConflictException(`Ya existe una empresa registrada con este docummento: ${empresaDuplicado.tipoDoc} ${empresaDuplicado.numDoc}  `)
      }
    }
    if(empresaExiste.razonSocial.trim().toLowerCase()!==dto.razonSocial.trim().toLowerCase()){
      const empresaDuplicado= await this.empresaRepository.findOne({
        where:{razonSocial: Raw(alias => `LOWER(${alias}) = LOWER(:razonSocial)`, { //raw es para el LOWER
          razonSocial: dto.razonSocial.trim(),
        }),
          id: Not(id),}
      });
      if(empresaDuplicado){
        throw new ConflictException(`Ya existe una empresa registrada con: ${empresaDuplicado.razonSocial}`);
      }
    }
    try {
      Object.assign(empresaExiste, dto);
      const resultado =await this.empresaRepository.save(empresaExiste);
      if(resultado){
        console.log('regitrando en act',resultado)
        this.eventEmiter.emit('empresa.modificada',{
          empresaId:resultado.id,
          usuarioResponsable:usuarioId,
          datos:resultado
        });
        return resultado;
      }
      
    } catch (error) {
      throw new InternalServerErrorException('Error al guardar los cambios de la empresa');
    }



  }
}
