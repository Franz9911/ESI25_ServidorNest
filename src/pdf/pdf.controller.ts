import { Body, Controller, Get, Query, Res } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { ProveedorService } from 'src/proveedor/proveedor.service';
import { FindProveedorDto } from 'src/proveedor/dto/find-proveedor.dto';
import { Response } from 'express';
import * as fs from 'fs';
import { path } from 'pdfkit';
@Controller('pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly proveedorService:ProveedorService,
  ) {}
  @Get('proveedores')
  async ImprimirListaProveedores(
    @Res() res: Response,
    @Query() dto:FindProveedorDto,
  ) {
    console.log('filtros');
    const proveedores=await this.proveedorService.Imprimir(dto);
    
    const filePath =await this.pdfService.GenerarPdfBase(
      proveedores.data,
      //columnas
      [
        { header: 'Num.', key: 'id', width: 30 },
        { header: 'Razón Social', key: 'empresa.razonSocial', width: 120 },
        { header: 'Nit', key: 'empresa.numDoc', width: 80 },
        { header: 'Celular', key: 'empresa.celular', width: 60 },
        { header: 'Estado', key: 'estado', width: 40 },
        { header: 'Correo' ,key: 'empresa.correoE', width: 140},
      ],
      //opciones
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

  //COTIZACIONES
  @Get('RespuestaCotiacion') 
  async VerRespuestaCotizacion(
    @Res() res:Response,
    @Query('filePath') filePath:string, //cambiar el nombre a respuestaPdf o pdfRespuesta
  
  ){
    console.log(filePath);
    const fullPath=`uploads/ordenCompra/${filePath}`;
    try{
      
      //verifica si el archivo existe
      await fs.promises.access(fullPath,fs.constants.F_OK);
    
    }catch(e){
      return res.status(404).json({error:'not error',
      message:'El archivo que solicisitaste no existe'});
    }
    res.setHeader('Content-Type','application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename=OcRespuesta.pdf'
    );
    const stream =fs.createReadStream(fullPath);
    stream.on('error',(e)=>{
      console.error('error al leer pdf:',e);
      //retornamos un error del strem
      return res.status(500).json({mensaje:'Error interno al tratar de leer el archivo'});
    })
    stream.pipe(res);
  }
}
