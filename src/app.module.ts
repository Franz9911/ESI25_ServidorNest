import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioModule } from './usuario/usuario.module';
import { Usuario } from './usuario/entities/usuario.entity';
import { PersonaModule } from './persona/persona.module';
import { Persona } from './persona/entities/persona.entity';
import { AutenticacionModule } from './autenticacion/autenticacion.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '5432',
      database: 'ESI-DB',
      entities: [Usuario,Persona],
      synchronize: true, // ¡Usar solo en desarrollo!
    }),
    ThrottlerModule.forRoot([
      {
        ttl:6000,
        limit:20
      }
    ]),
    UsuarioModule,
    PersonaModule,
    AutenticacionModule],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }],
  
})
export class AppModule {}
