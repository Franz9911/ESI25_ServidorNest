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
import { RegistroActividadModule } from './registro-actividad/registro-actividad.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RegistroActividad } from './registro-actividad/entities/registro-actividad.entity';
import { RegistroListener } from './registro-actividad/registro.listener';
//import { ProductoModule } from './producto/producto.module';
import { ProductoModule } from './producto/producto.module';
import { Producto } from './producto/entities/producto.entity';
import { MarcaModule } from './marca/marca.module';
import { Marca } from './marca/entities/marca.entity';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '5432',
      database: 'ESI-DB',
      entities: [Usuario,Persona,RegistroActividad,Producto,Marca],
      synchronize: true, // ¡Usar true solo en desarrollo!
    }),
    ThrottlerModule.forRoot([
      {
        ttl:6000,
        limit:20
      }
    ]),
    EventEmitterModule.forRoot(), //habiblida el sistema de eventos 
    UsuarioModule,
    PersonaModule,
    AutenticacionModule,
    RegistroActividadModule,
    ProductoModule,
    MarcaModule,
   ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    
  ],
  
})
export class AppModule {}
