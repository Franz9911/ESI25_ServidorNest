import { Module } from '@nestjs/common';
import { ProveedorService } from './proveedor.service';
import { ProveedorController } from './proveedor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { EmpresaModule } from 'src/empresa/empresa.module';
import { PersonaModule } from 'src/persona/persona.module';

@Module({
  imports:[TypeOrmModule.forFeature([Proveedor])
  ,EmpresaModule
  ],
  controllers: [ProveedorController],
  providers: [ProveedorService],
})
export class ProveedorModule {}
