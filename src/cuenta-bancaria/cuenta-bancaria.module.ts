import { Module } from '@nestjs/common';
import { CuentaBancariaService } from './cuenta-bancaria.service';
import { CuentaBancariaController } from './cuenta-bancaria.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentaBancaria } from './entities/cuenta-bancaria.entity';
import { EmpresaModule } from 'src/empresa/empresa.module';

@Module({
  imports:[TypeOrmModule.forFeature([CuentaBancaria]),
    EmpresaModule,
  ],
  controllers: [CuentaBancariaController],
  providers: [CuentaBancariaService],
  exports:[CuentaBancariaService],
})
export class CuentaBancariaModule {}
