import { Module } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { PersonaModule } from 'src/persona/persona.module';

@Module({
  imports:[TypeOrmModule.forFeature([Empresa]),
    //PersonaModule,
  ],
  controllers: [EmpresaController],
  providers: [EmpresaService],
  exports:[EmpresaService],
})
export class EmpresaModule {}
