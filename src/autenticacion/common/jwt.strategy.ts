import { Injectable} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy} from 'passport-jwt';

@Injectable()
//objetivo: optener y validar los jwt 
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt_cookie_accessToken'){ 
    constructor(){
        super({
            //el JwtAuthGuard solicita verificar los datos del req 
            // el req debe venir en la solicitud http 
            //dentro del req debe esta la cookie dentro de la cookie el jwt   
            jwtFromRequest: ExtractJwt.fromExtractors([ //extraemos el access_Token
                (req) => {                
                    console.log("extraendo el req.cookies");
                    console.log(req.cookies);
                  return req?.cookies?.['access_token'] ?? null;
                },
              ]),
            ignoreExpiration:false,
            secretOrKey:'Pancho1', //verificamos la cookie con el secreto
        });console.log("verificando la autenticacion");
    }
    //esta funcion se ejecuta de forma autoatica mediante passport.
    async validate(payload: any){ //validamos la cookie.
        // el return va al controlador que hizo la solicitud.
        return { 
            id:payload.sub,
            nombre:payload.nombre,
            rol:payload.rol}
    }
}
