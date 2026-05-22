import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { Brackets, Repository } from 'typeorm';
import { Persona } from 'src/persona/entities/persona.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { TipoCliente } from 'src/common/enums/tipo-cliente.enum';
import { EstadoCliente } from 'src/common/enums/tipo-cliente.enum';
import { FindClienteDto } from './dto/find-cliente.dto';
@Injectable()
export class ClienteService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository:Repository<Cliente>,
    @InjectRepository(Persona)
    private personaRepository:Repository<Persona>,
    @InjectRepository(Empresa)
    private empresaRepository:Repository<Persona>,
  ){
  }
  async create(dto: CreateClienteDto) {
    console.log('que pasa')
    let tipoCli="";
    if (dto.empresa && dto.persona) {
      throw new UnprocessableEntityException(
        'El cliente no puede tener empresa y persona al mismo tiempo'
      );
    }
    if (!dto.empresa && !dto.persona) {
      throw new UnprocessableEntityException(
        'El cliente debe tener empresa o persona'
      );
    }
    //verificacion de existencia
    if (dto.persona) {
      const personaExiste = await this.personaRepository.findOne({
        where: { id: dto.persona }
      });
      if (!personaExiste) {
        throw new NotFoundException('La persona no existe');
      }
      const clienteExiste= await this.clienteRepository.findOne({
        where:{
          persona:{
            id:personaExiste.id
          }
        }
      });
      if(clienteExiste){
        throw new ConflictException('La persona ya esta registrada como cliente');
      }
      tipoCli=TipoCliente.PERSONA;
    }
  
    if (dto.empresa) {
      const empresaExiste = await this.empresaRepository.findOne({
        where: { id: dto.empresa }
      });
      if (!empresaExiste) {
        throw new NotFoundException('La empresa no existe');
      }
      const clienteExiste =await this.clienteRepository.findOne({
        where:{
          empresa:{
            id:empresaExiste.id,
          }
        }
      });
      if(clienteExiste){
        throw new ConflictException('La empresa ya esta registrada como cliente')
      }
      tipoCli=TipoCliente.EMPRESA;
    }
  
    // 🧠 Crear entidad (NO guardar dto directo)
    const cliente = this.clienteRepository.create({
      tipoCliente: tipoCli,
      persona: dto.persona ? { id: dto.persona } : null,
      empresa: dto.empresa ? { id: dto.empresa } : null,
      estado: EstadoCliente.ACTIVO,
      puntosAcumulados: 0
    });
  
    return await this.clienteRepository.save(cliente);
  }
 
  async buscarClientes(dto:FindClienteDto) {
    const{estado, nombre, tipoCliente, fechaInicio, fechaFin}=dto;
    let fechaIn: Date | null = null;
    let fechaFi: Date | null = null;
    const query = this.clienteRepository.createQueryBuilder('cliente');
    query.leftJoinAndSelect('cliente.persona','persona');
    query.leftJoinAndSelect('cliente.empresa','empresa');
    if(fechaInicio!=''&& fechaInicio!='undefined'){
      fechaIn=new Date(`${fechaInicio} 00:00:00`)
      if(fechaFin!=''&& fechaFin!='undefined'){
        fechaFi=new Date(`${fechaFin} 23:59:59`);
      }else{
        fechaFi=new Date(`${fechaInicio} 23:59:59`)
      }
      query.andWhere('cliente.fechaReg BETWEEN :fechaIn AND :fechaFi', {
        fechaIn,
        fechaFi,
      }); 
    }
    if(tipoCliente){
      query.andWhere('cliente.tipoCliente = :tipoCliente',{tipoCliente})
    }
    if(estado){
      query.andWhere('cliente.estado = :estado',{estado});
    }
    if (nombre) {
      query.andWhere(
        new Brackets(qb => {
    
          if (!tipoCliente || tipoCliente === TipoCliente.EMPRESA) {
            qb.orWhere(
              'LOWER(empresa.razonSocial) LIKE LOWER(:razonSocial)',
              { razonSocial: `%${nombre}%` }
            );
          }
    
          if (!tipoCliente || tipoCliente === TipoCliente.PERSONA) {
            qb.orWhere(
              'LOWER(persona.nombre) LIKE LOWER(:nombre)',
              { nombre: `%${nombre}%` }
            );   
            qb.orWhere(
              'LOWER(persona.apellidos) LIKE LOWER(:apellidos)',
              { apellidos: `%${nombre}%` }
            );
            qb.orWhere(
              `LOWER(CONCAT(persona.nombre, ' ', COALESCE(persona.apellidos, ''))) LIKE LOWER(:nombreCompleto)`,
              { nombreCompleto: `%${nombre}%` }
            );
          }
        })
      );
    }
    query.orderBy('cliente.id','DESC')
    query.skip((dto.paginaActual-1)*dto.datosporPagina).take(dto.datosporPagina);
    const [data, totalItems]=await query.getManyAndCount();

    return {
      totalItems,
      data
    };
  }

  eliminarCliente(id: number) {
    //const clienteExiste
    return `This action removes a #${id} cliente`;
  }

  async modificarClienteServ(id: number, dto: UpdateClienteDto) {
    console.log("en el service serv",dto)
    const clienteExiste = await this.clienteRepository.findOne({
      where:{id}
    })
    if(!clienteExiste){
      throw new NotFoundException('No se puede encontrar al cliente en la DB');
    }
    try {
      Object.assign(clienteExiste,dto);
      const resultado = await this.clienteRepository.save(clienteExiste);
      //console.log(resultado)
      return resultado;
    } catch (error) {
      throw new InternalServerErrorException('Error al registrar los cambios');
    }
  }

  
}
