import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { PersonaModule } from 'src/persona/persona.module';
import { UsuarioSeeder } from './seeder/usuario-seeder';
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    PersonaModule,
  ],
  controllers: [UsuarioController],
  providers: [UsuarioService,UsuarioSeeder],
  exports:[UsuarioService,UsuarioSeeder]
})
export class UsuarioModule {}
