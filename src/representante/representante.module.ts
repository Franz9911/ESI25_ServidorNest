import { Module } from '@nestjs/common';
import { RepresentanteService } from './representante.service';
import { RepresentanteController } from './representante.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Representante } from './entities/representante.entity';
import { PersonaModule } from 'src/persona/persona.module';
import { EmpresaModule } from 'src/empresa/empresa.module';

@Module({
  imports:[TypeOrmModule.forFeature([Representante]),
    PersonaModule,EmpresaModule
  ],
  controllers: [RepresentanteController],
  providers: [RepresentanteService],
  exports:[RepresentanteService], 
})
export class RepresentanteModule {}
