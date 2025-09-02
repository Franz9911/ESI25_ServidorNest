import { Module } from '@nestjs/common';
import { AutenticacionService } from './autenticacion.service';
import { AutenticacionController } from './autenticacion.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule} from '@nestjs/passport';
import { JwtStrategy } from './common/jwt.strategy';
import { UsuarioModule } from 'src/usuario/usuario.module';
@Module({
  imports: [
    UsuarioModule,
    PassportModule,
    JwtModule.register({
      secret:'pancho1',
      signOptions:{expiresIn:'2h'} //este es que se toma en el loguin
    }),
  ],
  controllers: [AutenticacionController],
  providers: [AutenticacionService,JwtStrategy],
  exports: [AutenticacionService], 
})
export class AutenticacionModule {}
