import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CompraService } from './compra.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { BuscarCotizacionDto } from './dto/buscar-cotizacion.dto';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { file } from 'pdfkit';
import { JwtAuthGuard } from 'src/autenticacion/common/guards/jwtAuthGuard';
import { ActualizarCotizacionDto } from './dto/actualizar-cotizacion.dto';

@Controller('compra')
export class CompraController {
  constructor(private readonly compraService: CompraService) {}

  //@Post('registrar')
  /*crearCompra(@Body() createCompraDto: CreateCompraDto) {
    console.log('ingresamos a compra controller', createCompraDto) 
    return this.compraService.CrearCompraServ(createCompraDto);
  }*/
  @Post('cotizacion')
  crearCotizacion(@Body() dto:CreateCompraDto){
    //console.log('ingresamos a crear cotizacion')
    return this.compraService.crearCotizacion(dto);
  }
  @Post('agregarCotizacion')
  AgregarCotizacion(@Body()dto:CreateCotizacionDto){ 
    return this.compraService.AgregarCotizacionServ(dto); 
  }
  @Get('buscarCotizaciones')
  BuscarCotizaciones(
    @Query() dto:BuscarCotizacionDto
  ) {
    return this.compraService.BuscarCotizacionesServ(dto);
  }

  @Get('buscarOrdenesCompra')
  BuscarOrdenesCompra(
    @Query() dto:BuscarCotizacionDto
  ) {
    return this.compraService.BuscarOrdenesCompraServ(dto);
  }
  @Get('OC/:id')
  findOne(@Param('id') id: string) {
    return this.compraService.VerOCServ(+id);
  }

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
  //usar como ejemplo para el nombre de const, funcion,variable
  @UseGuards(JwtAuthGuard)
  @Patch('proveedor/OC/:idCompra/:idCotizacion/asignar')
  asignarProveedorOC(
    @Param('idCompra',ParseIntPipe) idCompra:number,
    @Param('idCotizacion',ParseIntPipe) idCotizacion:number,
    @Body() dto:UpdateCompraDto,
    @Req() req:any, 
  ){
    console.log(dto);
    const ID_USUARIO=req.user.id;
    return this.compraService.asignarCompraProveedorServ(dto,idCompra,idCotizacion,ID_USUARIO)
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.compraService.remove(+id);
  }
  @Get('compra')
  BuscarCompra(
  ) {
    console.log("hola")
    return this.compraService.buscarCompraServ();
  }
}
