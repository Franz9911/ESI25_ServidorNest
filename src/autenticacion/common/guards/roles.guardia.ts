import { 
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
 } from "@nestjs/common"; 
 import { Reflector } from "@nestjs/core";
 import { ROLES_KEY } from "../decorators/roles.decorador";
 import { Request } from "express";
import { Observable } from "rxjs";
 @Injectable()
 export class RolesGuard implements CanActivate{
    constructor(private reflector:Reflector){}
    canActivate(context: ExecutionContext): boolean {
        console.log("ingresamos al guardia");
        const reqRoles=this.reflector.getAllAndOverride<string[]>(ROLES_KEY,[
            context.getHandler(),
            context.getClass(),
        ]);
        console.log(reqRoles);
        if(!reqRoles || reqRoles.length===0){
            return true; //no se requiere roles => acceso permitido
        }
        const request= context.switchToHttp().getRequest<Request>();
        const usuario=request.body.u_id;
        if(!usuario){
            throw new ForbiddenException('No autorizado');
        } 
        const userRoles = ["admin"]//user.roles.map((r: any) => r.nombre); 
        const hasRol= reqRoles.some((role)=>userRoles.includes(role));
        if(!hasRol){
            throw new ForbiddenException('No tienes permisos para acceder a este recurso')
        }
        return true;
    }    
 }