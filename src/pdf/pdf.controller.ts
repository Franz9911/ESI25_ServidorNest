import { Body, Controller, Get, Query, Res } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { ProveedorService } from 'src/proveedor/proveedor.service';
import { FindProveedorDto } from 'src/proveedor/dto/find-proveedor.dto';
import { Response } from 'express';
import * as fs from 'fs';
import { path } from 'pdfkit';
import { PersonaService } from 'src/persona/persona.service';
import { CompraService } from 'src/compra/compra.service';
import { BuscarProductosDto } from 'src/producto/dto/find-producto.dto';
import { ProductoService } from 'src/producto/producto.service';
import { BuscarCotizacionDto } from 'src/compra/dto/buscar-cotizacion.dto';
@Controller('pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly proveedorService:ProveedorService, 
    private readonly personaService: PersonaService,
    private readonly compraService: CompraService,
    private readonly productoService:ProductoService,
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
        logoPath: 'logoESI.png', //solo usar formato png o jpg
        texto:`A continuación, se presenta la información de los proveedores registrados en el sistema ESI-Tec,`+
        ` filtrada según los siguientes criterios:  Razon Social:${dto.nombreEmpresa || 'No aplica'}, Estado: ${dto.estado||'No aplica'},  Num. Doc:`+
        ` ${dto.nitEmpresa||'No aplica'},  Período  de  registro: del ${dto.fechaInicio || 'No aplica'} hasta`+
        ` ${dto.fechaFin ||'No aplica'} `
        
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
  //personas
  @Get('personas')
  async ImprimirListaPersonas(
    @Res() res: Response,
    @Query() dto:any,
  ) {
    console.log('filtros',dto);
    const proveedores=await this.personaService.Imprimir(dto);
     
    const filePath =await this.pdfService.GenerarPdfBase(
      proveedores.data,
      //columnas
      [
        { header: 'Num.', key: 'id', width: 30 },
        { header: 'Nombre', key: 'nombre', width: 70 },
        { header: 'Apellidos', key: 'apellidos', width:70 },
        { header: 'Tipo', key: 'tipoDoc', width:30},
        { header: 'Num Doc', key: 'numDoc', width: 50 },
        { header: 'Celular', key: 'celular', width: 55 },
        { header: 'Correo' ,key: 'correoE', width: 90},
        { header: 'fecha Reg', key: 'fechaReg', width:50 },
      ],
      //opciones
      {
        fileName: 'Personas.pdf',
        title: 'Reporte de Personas',
        logoPath: 'logoESI.png', //solo usar formato png o jpg
        texto:`A continuación, se presenta la información de los personas registradas en el sistema ESI-Tec,`+
        ` filtrada según los siguientes criterios:  nombre:${dto.nombre || 'No aplica'},  Num. Doc:`+
        ` ${dto.numDoc||'No aplica'},  Período  de  registro: del ${dto.fechaInicio || 'No aplica'} hasta`+
        ` ${dto.fechaFin ||dto.fechaInicio ||'No aplica'} `
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

    //compras
    @Get('compras')
    async ImprimirListaCompras(
      @Res() res: Response,
      @Query() dto:BuscarCotizacionDto,
    ) {
      console.log('filtros',dto);
      const proveedores=await this.compraService.imprimir(dto);
      //console.log(proveedores.data);
      const filePath =await this.pdfService.GenerarPdfBase(
        proveedores.data,
        //columnas
        [
          { header: 'Num.', key: 'id', width: 30 },
          { header: 'Proveedor', key: 'proveedor.empresa.razonSocial', width: 60 },
          { header: 'Folder', key: 'folder', width:40 },
          { header: 'Recep.', key: 'estadoRec', width:35},
          { header: 'F. Reg', key: 'fechaReg', width:50 },         
          { header: 'P.P.', key: 'planPagos.estado', width:40 },
          { header: 'M.O.', key: 'planPagos.monedaOperacion', width: 30 },
          { header: 'M.T.', key: 'planPagos.montoTotalOperacion', width: 60 },
          { header: 'R.M.', key: 'planPagos.totalRecargoMora', width: 50 },
          { header: 'Saldo', key: 'planPagos.saldoPendiente', width: 60 },
          { header: 'M.T. BOB', key: 'planPagos.montoTotalML', width: 50 },
        ],
        //opciones
        {
          fileName: 'Compras.pdf',
          title: 'Reporte de Compras',
          logoPath: 'logoESI.png', //solo usar formato png o jpg
          texto:`A continuación, se presenta la información de las compras registradas en el sistema ESI-Tec,`+
          ` filtrada según los siguientes criterios:  Razon social:${dto.razonSocial || 'No aplica'},  Folder:`+
          ` ${dto.folder||'No aplica'},  Período  de  registro: del ${dto.fechaInicio || 'No aplica'} hasta`+
          ` ${dto.fechaFin ||dto.fechaInicio ||'No aplica'} `
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

  //productos
  @Get('productos')
  async ImprimirListaProductos(
    @Res() res: Response,
    @Query() dto:BuscarProductosDto,
  ) {
    console.log('filtros',dto);
    const productos=await this.productoService.imprimir(dto);
    //console.log('lista de productos',productos.data);
    const filePath =await this.pdfService.GenerarPdfBase(
      productos.data,
      //columnas
      [
        { header: 'Num.', key: 'id', width: 30 },
        { header: 'Imagen', key: 'imagenProd', width: 90,imageHeight:60 },
        { header: 'marca', key: 'marca.nombre', width:50 },
        { header: 'Modelo.', key: 'modelo', width:100},
        { header: 'D.V.' , key: 'habilitarVenta', width: 30},
        { header: 'D.R.' ,key: 'habilitarRefac', width: 30}, 
        { header: 'U.D.' , key:'unidadesDis', width: 50},
        { header: 'P.V.B.', key: 'precio', width: 50 },
        { header: 'MGan %', key:'margenGanancia', width: 40},
                
        
      ],
      //opciones
      {
        fileName: 'Productos.pdf',
        title: 'Reporte de Productos',
        logoPath: 'logoESI.png', //solo usar formato png o jpg
        texto:`A continuación, se presenta la información de los productos registradas en el sistema ESI-Tec,`+
        ` filtrada según los siguientes criterios:  modelo:${dto.modelo || 'No aplica'},  Marca:`+
        ` ${dto.marcaId||'No aplica'},  Habilitado para refaccion: del ${dto.habilitarRefac || 'No aplica'}, habilitado para venta`+
        ` ${dto.habilitarVenta ||'No aplica'}, Nivel bajo en almacen: ${dto.minUnidades} 
        El precio de venta no incluye el margen de ganacia a favor de la empresa ESI
        `
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
