import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; 
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
import { EmpresaModule } from './empresa/empresa.module';
import { Empresa } from './empresa/entities/empresa.entity';
import { ProveedorModule } from './proveedor/proveedor.module';
import { Proveedor } from './proveedor/entities/proveedor.entity';
import { RepresentanteModule } from './representante/representante.module';
import { Representante } from './representante/entities/representante.entity';
import { CuentaBancariaModule } from './cuenta-bancaria/cuenta-bancaria.module';
import { CuentaBancaria } from './cuenta-bancaria/entities/cuenta-bancaria.entity';
import { PdfModule } from './pdf/pdf.module';
import { CompraModule } from './compra/compra.module';
import { Compra } from './compra/entities/compra.entity';
import { DetalleCompra } from './compra/entities/detalle.entity';
import { PlanPagoCompra } from './compra/entities/plan-pago.entity';
import { Cotizacion } from './compra/entities/cotizacion.entity';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true,
      envFilePath:'.env' //frzar a buscar la ruta del archivo .env.
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '5432',
      database: 'ESI-DB',
      entities: [Usuario,Persona,RegistroActividad,
        Producto,Marca,Empresa,Proveedor,Representante,
        CuentaBancaria,Compra,DetalleCompra,PlanPagoCompra,Cotizacion],
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
    EmpresaModule,
    ProveedorModule,
    RepresentanteModule,
    CuentaBancariaModule,
    PdfModule,
    CompraModule,
   
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
