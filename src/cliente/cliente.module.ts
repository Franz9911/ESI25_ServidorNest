import { Module } from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { ClienteController } from './cliente.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Cliente, Persona,Empresa])],
  controllers: [ClienteController],
  providers: [ClienteService],
  exports:[ClienteService]
})
export class ClienteModule {}
