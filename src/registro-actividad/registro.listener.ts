import { Injectable } from "@nestjs/common";
import { RegistroActividadService } from "./registro-actividad.service";
import { OnEvent} from '@nestjs/event-emitter'

@Injectable()
export class RegistroListener{
    constructor(private readonly registroActividadService:RegistroActividadService)
    {}
    @OnEvent('persona.creada')
    async handledUsuarioCreado(event :any){
        console.log("ingresaos al listener");
        await this.registroActividadService.create({
            usuarioResponsable:event.usuarioResponsable,
            accion:'crear',
            entidad:'persona',
            idReferencial:event.personaId,
            datos:event.datos 
        })     
    }
    @OnEvent('producto.creado')
    async handledProductoCreado(event :any){
        console.log("ingresaos al listener");
        await this.registroActividadService.create({
            usuarioResponsable:event.usuarioResponsable,
            accion:'crear',
            entidad:'producto',
            idReferencial:event.productoId,
            datos:event.datos 
        })     
    }
    @OnEvent('producto.modificado')
    async handledProductoEditado(event :any){
        await this.registroActividadService.create({
            usuarioResponsable:event.usuarioResponsable,
            accion:'modificar',
            entidad:'producto',
            idReferencial:event.productoId,
            datos:event.datos 
        })     
    }
}