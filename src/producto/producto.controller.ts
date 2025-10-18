import { Controller, Get, Post, Body, Patch, Param, Delete, 
  UseGuards, Req, BadRequestException, Query, UnauthorizedException, 
  Logger, HttpException, HttpStatus, UnprocessableEntityException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { JwtAuthGuard } from 'src/autenticacion/common/guards/jwtAuthGuard';
import * as Busboy from 'busboy';
import { Readable } from 'stream';
import { Request } from 'express';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { BuscarProductosDto } from './dto/find-producto.dto';
import { ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Producto } from './entities/producto.entity';


@Controller('producto')
export class ProductoController {
  private readonly logger= new Logger(ProductoController.name);

  constructor(private readonly productoService: ProductoService) {}
  @UseGuards(JwtAuthGuard)
  @Post('registrarProducto') 
  @UseInterceptors(FileInterceptor('imagenProd',{
    storage:diskStorage({
      destination:join(__dirname,'..','..','uploads','productos'),
      filename:(req,file,cb)=>{
        const fecha=new Date().toISOString().split('T')[0];
        const randon = Date.now(); // milisegundo
        const partes = file.originalname.split('.');
        const nombreImagen=partes[0].replace(/\s+/g, '_'); // eliminar espacios;
        const ext=extname(file.originalname).toLowerCase();
        cb(null,`prod-${fecha}-${nombreImagen}-${randon}${ext}`);
      }
    }),
    limits:{fileSize:1*1024*1024},//1MB
    fileFilter:(req, file, cb)=> {
      if(!file.mimetype.startsWith('image/')){
        return cb(new BadRequestException('Solo se permite archivos de imagen'),false);
      }
      if(!file.originalname.toLowerCase().endsWith('.avif')){
        return cb(new BadRequestException('Solo se permite el formato .avif para las imagenes'),false);
      }
      cb(null,true);
    },
  }))
  async crearProducto(
    @Body()creaproducto:CreateProductoDto,
    @Req() req:any,
    @UploadedFile()file?:Express.Multer.File) {
    //console.log(req);
    const usuarioId=req.user.id; 
    const marca={
      id:creaproducto.marcaId,
      nombre:creaproducto.marcaNombre
    }
    if(file)  creaproducto.imagenProd = `uploads/productos/${file.filename}`;
    return this.productoService.crearProductoServ(creaproducto,marca,usuarioId);
  }

  @Get('buscarProductos')
   async buscarProductos(@Query() filtros: BuscarProductosDto) {
    if(!filtros.limit || !filtros.page) {
      throw new UnauthorizedException('La consulta no cuenta con la informacion necesaria');
    }
      return await this.productoService.buscarProductosServ(filtros);
  }

  @Get('detalleProducto')
  async buscarProductoPorId(
    @Query('id') id?: string, 
    ) {
    return await this.productoService.buscarProductoPorIdServ(+id);
  }
  //Eiminar producto
  //entrada id de producto
  @Delete('eliminarProducto')
  eliminarProducto(@Query('id', ParseIntPipe) id: number) {
    return this.productoService.eliminarProductoServ(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('actualizar/:id')
  @UseInterceptors(FileInterceptor('imagenProd',{
    storage:diskStorage({
      destination:join(__dirname,'..','..','uploads','productos'),
      filename:(req,file,cb)=>{
        const fecha=new Date().toISOString().split('T')[0];
        const randon = Date.now(); // milisegundo
        const partes = file.originalname.split('.');
        const nombreImagen=partes[0].replace(/\s+/g, '_'); // eliminar espacios;
        const ext=extname(file.originalname).toLowerCase();
        cb(null,`prod-${fecha}-${nombreImagen}-${randon}${ext}`);
      },
    }),
    limits:{fileSize:1*1024*1024}, //1MB
    fileFilter:(req,file,cb)=>{
      if(!file.mimetype.startsWith('image/')){
        return cb(new BadRequestException('Solo se permite archivos de imagen'),false);
      }
      if(!file.originalname.toLowerCase().endsWith('.avif')){
        return cb(new BadRequestException('Solo se permite el formato .avif para las imagenes'),false);
      }
      cb(null,true);
    }
  }))
  async actualizarProducto(
    @Param('id',ParseIntPipe) id: number,
    @Body() UpdateProductoDto:UpdateProductoDto,
    @Req() req:any,
    @UploadedFile() file?: Express.Multer.File){
      const usuarioId=req.user.id;
      if(file)  UpdateProductoDto.imagenProd = `uploads/productos/${file.filename}`;
      return this.productoService.actualizarSer(id,UpdateProductoDto,usuarioId)
  }

}
