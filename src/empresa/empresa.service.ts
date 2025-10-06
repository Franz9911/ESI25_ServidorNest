import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { Between, ILike, Repository } from 'typeorm';
import { PersonaService } from 'src/persona/persona.service';
import { PaginacionResultado } from 'src/Paginacion-resultado.dto';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>, 
    
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

  remove(id: number) {
    return `This action removes a #${id} empresa`;
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
    return empresaAux;
  }
}
