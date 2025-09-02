import { Module } from '@nestjs/common';
import { RegistroActividadService } from './registro-actividad.service';
import { RegistroActividadController } from './registro-actividad.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroActividad } from './entities/registro-actividad.entity';
import { RegistroListener } from './registro.listener';

@Module({
  imports:[TypeOrmModule.forFeature([RegistroActividad])],
  controllers: [RegistroActividadController],
  providers: [RegistroActividadService, RegistroListener],
  exports:[RegistroActividadService],
})
export class RegistroActividadModule {}
