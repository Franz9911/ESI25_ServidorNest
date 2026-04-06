import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cotizacion } from '../entities/cotizacion.entity';
import { QueryRunner, Repository } from 'typeorm';
import { Proveedor } from 'src/proveedor/entities/proveedor.entity';
import { Representante } from 'src/representante/entities/representante.entity';
import { PdfService } from 'src/pdf/pdf.service';
import { CreateCompraDto } from '../dto/create-compra.dto';
import { Compra } from '../entities/compra.entity';
import { DetalleCompra } from '../entities/detalle.entity';
import { CreateCotizacionDto } from '../dto/create-cotizacion.dto';
import { ActualizarCotizacionDto } from '../dto/actualizar-cotizacion.dto';

@Injectable()
export class CotizacionService {
    constructor(
        @InjectRepository(Cotizacion)
        private readonly cotizacionRepository:Repository<Cotizacion>,
        @InjectRepository(Proveedor)
        private readonly proveedorRepository:Repository<Proveedor>,
        @InjectRepository(Representante)
        private readonly representanteRepository:Repository<Representante>,
        private readonly pdfService:PdfService,
    ){}
    async registrarCotizacion(dto:CreateCotizacionDto[],detalles:DetalleCompra[],compra:Compra, queryRunner:QueryRunner):Promise<string>{
        console.log('ingresamos al service cotizacion');
        
        let folderAux='';
        for(const item of dto){
            const proveedor = await queryRunner.manager.findOne(Proveedor,{
                where:{id:item.idProveedor},relations:['empresa']
            });
            if(!proveedor){
                throw new NotFoundException(`No se encontro al proveedor ${item.idProveedor}`);
            }
            const representante = await queryRunner.manager.findOne(Representante,{
                where:{
                    id:item.idRepresentante,
                    empresa:{id:proveedor.empresa.id}
                },
            });
            console.log(representante);
            if(!representante){
                throw new NotFoundException(`No se encontro al representante`);
            }  
            const cotizacion = queryRunner.manager.create(Cotizacion,{
                compra:compra, //la compra ya existe y esta en el contexto
                proveedor,
                representante,
            });
            await queryRunner.manager.save(cotizacion);
            const columnas = [
                { header: 'Num.', key: 'id', width: 30 },
                { header: 'modelo', key: 'producto.modelo', width: 120 },
                { header: 'marca', key: 'producto.marca.nombre' },
                { header: 'unidades', key: 'unidAdquiridas', width: 80 },
              ];
              //crear pdf de la cotizacion
              //folderAux es una ruta unica para para todas las cotizaciones de una OC
              folderAux = await this.pdfService.generarCotizacionPdf(
                cotizacion,
                detalles,  
                columnas,
              );
        }
        return folderAux;
    }
    async agregarCotizacion(dto:CreateCotizacionDto,compra:Compra,queryRunner:QueryRunner):Promise<Cotizacion>{
        const proveedor = await queryRunner.manager.findOne(Proveedor,{
            where:{id:dto.idProveedor},relations:['empresa'],
        });
        if(!proveedor){
            throw new NotFoundException('No se encontro al Proveedor');
        }
        const representante =await queryRunner.manager.findOne(Representante,{
            where:{
                id:dto.idRepresentante,
                empresa:{id:proveedor.empresa.id},
            },
        });
        if(!representante){
            throw new NotFoundException('No se encontro al representante');
        } 
        console.log(representante);
        const cotizacionExiste = await queryRunner.manager.findOne(Cotizacion, {
            where: {
              compra: { id: compra.id },
              proveedor: { id: proveedor.id },
              representante: { id: representante.id },
            },
          });
          
        if(cotizacionExiste) {
            throw new ConflictException('Ya existe una cotización para este proveedor y representante');
        }
          
        const cotizacion = queryRunner.manager.create(Cotizacion,{
            compra,
            proveedor,
            representante,
        });
         await queryRunner.manager.save(cotizacion); 
         const columnas =[
            { header: 'Num.', key: 'id', width: 30 },
            { header: 'modelo', key: 'producto.modelo', width: 120 },
            { header: 'marca', key: 'producto.marca.nombre'},
            { header: 'unidades', key: 'unidAdquiridas', width: 80 },
          ];
        const folderAux=await this.pdfService.generarCotizacionPdf(cotizacion,compra.detalles,columnas);
        return cotizacion
    }

    async buscarCotizacionAsignada(compraId:number,cotizacionId:number,queryRunner:QueryRunner):Promise<Cotizacion>{
        const cotizacion = await queryRunner.manager.findOne(Cotizacion,{
            where:{id:cotizacionId,compra:{id:compraId}},
            //lock:{mode:'pessimistic_write'}
        });
        if(!cotizacion){
            throw new NotFoundException('No se encontro la cotizacion asignada');
        }
        return cotizacion;
    }
     async actualizarRespuesta(idOC:number,cotizadcionId:number,dto:ActualizarCotizacionDto,):Promise<Cotizacion>{
        const cotizacion = await this.cotizacionRepository.findOne({
            where:{id:cotizadcionId,compra:{id:idOC}},
        });
        if(!cotizacion){
            throw new NotFoundException('No se encontro la cotizacion');
        }
        Object.assign(cotizacion,dto);
        return this.cotizacionRepository.save(cotizacion);
     }
}
