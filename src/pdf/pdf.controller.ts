import { Body, Controller, Get, Query, Res } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { ProveedorService } from 'src/proveedor/proveedor.service';
import { FindProveedorDto } from 'src/proveedor/dto/find-proveedor.dto';
import { Response } from 'express';
import * as fs from 'fs';
@Controller('pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly proveedorService:ProveedorService,
  ) {}
  @Get('proveedores')
  async ImprimirLitsaPrveedores(
    @Res() res: Response,
    @Query() dto:FindProveedorDto,
  ) {
    console.log('filtros');
    const proveedores=await this.proveedorService.Imprimir(dto);
    
    const filePath =await this.pdfService.GenerarPdfBase(
      proveedores.data,
      [
        { header: 'Num.', key: 'id', width: 30 },
        { header: 'Razón Social', key: 'empresa.razonSocial', width: 120 },
        { header: 'Nit', key: 'empresa.numDoc', width: 80 },
        { header: 'Celular', key: 'empresa.celular', width: 60 },
        { header: 'Estado', key: 'estado', width: 40 },
        { header: 'Correo' ,key: 'empresa.correoE', width: 140},
      ],
      
      {
        fileName: 'proveedores.pdf',
        title: 'Reporte de Proveedores',
        logoPath: 'kuma2.png', //solo usar formato png o jpg
      },
      dto);
      
    res.setHeader('Content-Type','application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename=proveedores.pdf'
    );
    const stream =fs.createReadStream(filePath);
    stream.pipe(res);
    //pdfStream.getStream().pipe(res)
  }
}
