import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService{
    private transporte
    constructor(
        private configService:ConfigService
    ){
        this.transporte=nodemailer.createTransport({
            service:'gmail',
            auth:{

                user:this.configService.get<string>('USUARIO_GMAIL'),
                pass:this.configService.get<string>('CONTRASENHA_GMAIL'),
            }
        })
    }
    async enviarCodigoDeRecuperacion(to:string,codigo:string){
        await this.transporte.sendMail({
            from:`"Soporte ESI-Tec"<${this.configService.get<string>('USUARIO_GMAIL')}>`,
            to,
            subject:'Recuperacion de contraseña',
            text:`Tu codigo de recuperacion es: ${codigo} El codigo tiene valides por 5 minutos.`
        })
    }

}