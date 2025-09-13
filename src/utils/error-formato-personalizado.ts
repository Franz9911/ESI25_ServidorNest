import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Response } from "express";
@Catch(HttpException)
export class ErrorFormatoPersonalizado implements ExceptionFilter{
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx=host.switchToHttp();
        const response= ctx.getResponse<Response>();
        const status=exception.getStatus();
        
        const exceptionResponce=exception.getResponse();
        let errorMensaje='error inesperado';
        let cause=null;

        if(typeof exceptionResponce==='string'){
            errorMensaje=exceptionResponce;
        }else if(typeof exceptionResponce=== 'object'){
            const res=exceptionResponce as Record<string, any>;
            errorMensaje=res.message || res.error||'Error';
            cause=res.cause || 'null'; 
        }
        response.status(status).json({
            status,
            error:errorMensaje,
            cause
        });
    }
}