import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
//esta guardia usara la logica de jwt.strategy para realizar la validacion del jwt.
//la counicacion se da gracias al paraetro 'jwt_cookie_accessToken' 
export class JwtAuthGuard extends AuthGuard('jwt_cookie_accessToken') {}