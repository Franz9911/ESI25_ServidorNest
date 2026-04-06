import { Module } from '@nestjs/common';
import { LoteService } from './lote.service';

@Module({
  providers: [LoteService],
  exports: [LoteService],
})
export class LoteModule {}
