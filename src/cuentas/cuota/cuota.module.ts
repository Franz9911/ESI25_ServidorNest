import { Module } from '@nestjs/common';
import { CuotaService } from './cuota.service';

@Module({
  providers: [CuotaService]
})
export class CuotaModule {}
