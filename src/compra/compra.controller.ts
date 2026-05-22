import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, Req, UseGuards, ParseIntPipe, BadRequestException, UploadedFiles } from '@nestjs/common';
import { CompraService } from './compra.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { BuscarCotizacionDto } from './dto/buscar-cotizacion.dto';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { file } from 'pdfkit';
import * as fs from 'fs';
import { JwtAuthGuard } from 'src/autenticacion/common/guards/jwtAuthGuard';
import { ActualizarCotizacionDto } from './dto/actualizar-cotizacion.dto';
//import { CreatePagoCompraDto } from './dto/create-pago.dto';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CreateMovimientosFinancieroDto } from 'src/movimientos-financieros/dto/create-movimientos-financiero.dto';
import { CreateDetalleCompra } from './dto/create-detalle.dto';
import { CreateDevolucionCompraDto } from './dto/create-devolucion-compra.dto';
import { AnularPagoDto } from 'src/finanzas/dto/anular-pago-cuota.dto';

@Controller('compra')
export class CompraController {
  constructor(private readonly compraService: CompraService) {}

  //######COTIZACIONES
  @Post('cotizacion')
  registrarOrdenCompra(@Body() dto:CreateCompraDto){
    //console.log('ingresamos a crear cotizacion')
    return this.compraService.registrarOrdenCompraServ(dto);
  }
  @Post('asignacion/directa')
  asingacionDirectaCompra(@Body() dto:CreateCompraDto){
    //console.log('ingresamos a crear cotizacion')
    return this.compraService.asignacionDirectaCompraServ(dto);
  }
  @Post('agregarCotizacion')
  AgregarCotizacion(@Body() dto:CreateCotizacionDto){ 
    return this.compraService.AgregarCotizacionServ(dto); 
  }
  @Get('buscarCotizaciones')
  BuscarCotizaciones(
    @Query() dto:BuscarCotizacionDto
  ) {
    return this.compraService.BuscarCotizacionesServ(dto);
  }

  ///#######COMPRA
  @Get('buscarOrdenesCompra')
  BuscarOrdenesCompra(
    @Query() dto:BuscarCotizacionDto
  ) {
    return this.compraService.BuscarOrdenesCompraServ(dto);
  }
  

  @Get('cotizacion/:id')
  verDetalleCotizacion(@Param('id') id: string) {
    console.log('en ver cotizacion');
    const relaciones = ['detalles','detalles.producto.marca','cotizaciones',
    'cotizaciones.representante.persona','cotizaciones.proveedor.empresa']
    return this.compraService.VerCotizacionServ(+id, relaciones);
  }

  @Get('OC/:id')
  verDetalleOC(@Param('id') id: string) {
    console.log('en ver ordencompra');
    const relaciones = ['detalles','detalles.producto.marca',
   'cotizacionAsignada.representante.persona','cotizacionAsignada.proveedor.empresa',
   'planPag', 'planPag.cuotas', 'proveedor.empresa'
  ]
    return this.compraService.VerOrdenCompraServ(+id, relaciones);
  }
    //usar como ejemplo para el nombre de const, funcion,variable
    @UseGuards(JwtAuthGuard)
    @Patch('proveedor/OC/:idCompra/:idCotizacion/asignar')
    asignarProveedorOC(
      @Param('idCompra',ParseIntPipe) idCompra:number,
      @Param('idCotizacion',ParseIntPipe) idCotizacion:number,
      @Body() dto:UpdateCompraDto,
      @Req() req:any, 
    ){
      console.log('ingresamos a asignar')
      const ID_USUARIO=req.user.id;
      return this.compraService.asignarCompraProveedorServ(dto,idCompra,idCotizacion,ID_USUARIO)
    }
    
  /*@Get('compra') 
  BuscarCompra( //quien usa esto? 
  ) {
    console.log("hola TAROLAAAA")
    return this.compraService.buscarCompraServ();
  }*/
  @Get('total/reembolsado/:idPlan') 
  totalReembolsado(@Param('idPlan',ParseIntPipe) idPlan:number,){
    //const total= this.compraService.verMontoReembolsado(idPlan);
    
    //return total;
  }
  @Patch('anular/:idOC')
  anularCompra(
    @Param('idOC',ParseIntPipe) idOC:number,
    @Body()dto:AnularPagoDto
    ){
    console.log('en el controller anulando compra')
    const pago =null;
    return this.compraService.anularCompra(idOC,dto)
  }
  
  @Patch('devolucion/:idOC')
  devolucionCompra(
    @Param('idOC',ParseIntPipe) idOC:number,
    @Body() dto:CreateDevolucionCompraDto,
  ){
    return this.compraService.devolucionCompra(dto,idOC)
  }
  //######PAGOS
  @Get('compra/:id/plan')
  verPago(@Param('id') id: string) {
    const relaciones=['planPagos','planPagos.cuotas'];
    console.log('pagos');
    return this.compraService.VerOrdenCompraServ(+id, relaciones);
  }

  
  @UseGuards(JwtAuthGuard)
  @Post('pago/:idOC/:idCuota')
  @UseInterceptors(FilesInterceptor('comprobantes',5,{
    storage:diskStorage({
      destination:(req,file,cb) => {
        const idOC = req.params.idOC;
        const idCuota = req.params.idCuota;
        const folder = join(__dirname,'..','..','uploads','ordenCompra',`OC${idOC}`,`comprobantesPago`);
        console.log(folder);
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder, { recursive: true });
        }
        cb(null,folder);
      },  
      filename:(req,file,cb)=>{
        console.log('cargando comprobante'); 
        const comprobante=file.originalname.replace(/\s+/g, '_'); // eliminar espacios;
        
        cb(null,comprobante);
      },
    }),limits:{fileSize:4*1024*1024},
    fileFilter:(req, file, cb)=> { 
      console.log('filter')
      if(!file.mimetype.startsWith('image/')){
        return cb(new BadRequestException('Solo se permite archivos de imagen'),false);
      }

      cb(null,true);
    },
  }))
  /*async registrarPago(
    @UploadedFiles() comprobantes: Express.Multer.File[],
    @Body('data') data: string,
    @Param('idOC',ParseIntPipe) idOC:number,
    @Param('idCuota',ParseIntPipe) idCuota:number){

    const dto = plainToInstance(CreatePagoCompraDto, JSON.parse(data));
    await validateOrReject(dto);
    console.log('En el controller: ',comprobantes)
    if(comprobantes){
     // CreatePagoCompraDto.comprobante=`uploads/productos/${comprobante.filename}`;
     console.log('En el controller: ',comprobantes)
    }
    //return this.compraService.registrarPagoServ(idOC,idCuota,dto,comprobantes)
  }*/


  //#######COTIZACIONES
  @UseGuards(JwtAuthGuard)
  @Patch('cotizacion/respuesta/:id/:cotizacionId')
  @UseInterceptors(FileInterceptor('pdfRespuesta',{
    storage:diskStorage({
      destination:(req,file,cb)=>{
        const id=req.params.id;
        const folder=join(__dirname,'..','..','uploads','ordenCompra',`OC${id}`,'respuestas');
        cb(null,folder);
      },  
      filename:(req,file,cb)=>{
        console.log('cargando pdf');
        const nombrePdf=file.originalname.replace(/\s+/g, '_'); // eliminar espacios;
        
        cb(null,nombrePdf);
      },
    }),limits:{fileSize:1*1024*1024},
  }))
  async AgregarModificarRespuestaCotizacion(
    @Param('cotizacionId',ParseIntPipe) cotizacionId:number,
    @Param('id',ParseIntPipe) id: number, 
    @Body() dto:ActualizarCotizacionDto,
    @Req() req:any,
    @UploadedFile() file?:Express.Multer.File
    ) {
      const usuarioId=req.user.id;
      const compraId=req.params.id;
      if(file) dto.pdfRespuesta=`OC${compraId}/respuestas/${file.filename}`
     return this.compraService.AgregarModificarRespuestaCotizacionServ(id,cotizacionId, dto,usuarioId);
  }

  
  //#########PLAN DE PAGOS

  @Get('plan/pago/:idOC')
  verPlanPagos(
    @Param('idOC',ParseIntPipe) idOC:number
  ){
    console.log('pagoo')
    return this.compraService.verPlanPago(idOC);
  }
}
