import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, BadRequestException, Query, UnauthorizedException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { JwtAuthGuard } from 'src/autenticacion/common/guards/jwtAuthGuard';
import * as Busboy from 'busboy';
import { Readable } from 'stream';
import { Request } from 'express';
import { join } from 'path';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { BuscarProductosDto } from './dto/find-producto.dto';



@Controller('producto')
export class ProductoController {
  private readonly logger= new Logger(ProductoController.name);

  constructor(private readonly productoService: ProductoService) {}
  @UseGuards(JwtAuthGuard)
  @Post('registrarProducto')
  async crearProducto(
    @Req() req:Request & Readable) {
    console.log("ingresamos");
     const usuarioId=(req as any).user.id;
     console.log('id usuario', usuarioId);
     this.logger.log("prueba 1")
    return new Promise((resolve,rejects)=>{
      const busboy =Busboy({headers:req.headers});
      const folderProducto="productos";
      //let body:Partial <CreateProductoDto>={};
      const body: any = {};
      const tamañoMax=1*1024*1024;
      let imagenRuta:string|null=null;
      
      busboy.on('file',(fildname,file,info)=>{
        console.log('ingresamos a busboy');
        let { filename, mimeType } = info;
         // Validación MIME tipo imagen
         if (!mimeType.startsWith('image/')) { //validamos que el archivo sea una imagen.
          return rejects( new HttpException({
            status:HttpStatus.UNPROCESSABLE_ENTITY,
            error:'Solo  se perite guardar imagenes'
            },HttpStatus.UNPROCESSABLE_ENTITY,{
              cause: 'Solo  se perite guardar imagenes'
            })

          );
        }
        console.log(filename)
        const fecha=new Date().toISOString().split('T')[0];
        const timestamp = Date.now(); // milisegundo
        const partes = filename.split('.');
        const nombreImagen=partes[0].replace(/\s+/g, '_'); // eliminar espacios;
        const extencionImg=partes[1];
        if(extencionImg!=='avif'){ //validamos que el formato sea .avif
          //una persona puede cambiar la extencion del archivo y hacerla pasar por .avif 
          return rejects(new HttpException({
            status:HttpStatus.UNPROCESSABLE_ENTITY,
            error:'Solo  se perite formato .avif para las imagenes'
            },HttpStatus.UNPROCESSABLE_ENTITY,{
              cause: 'Solo  se perite formato .avif para las imagenes'
            })
          )
        }
        filename=fecha+nombreImagen+timestamp+"."+extencionImg;
        console.log("nombre de imagen",filename);
        const folderPaht=join(__dirname,'..','..',folderProducto);
        console.log('Subiendo el archivo a:', folderPaht);
        if(!existsSync(folderPaht)){
          mkdirSync(folderPaht,{recursive:true});
        }
        const savePath=join(folderPaht,filename);
        let totalBytes=0;
        
        file.on('data', (chunk) => { //chunk son fracmentos de de la imagen. 
          totalBytes += chunk.length; // al sumar los chun tendremos el tamaño de la imagen.
          if(totalBytes>tamañoMax){
            file.unpipe();
            rejects(new HttpException({
              status:HttpStatus.UNPROCESSABLE_ENTITY,
              error:'Archivo demasiado grande (máx 1MB).'
              },HttpStatus.UNPROCESSABLE_ENTITY,{
                cause: 'Archivo demasiado grande (máx 1MB).'
              })
            );
          } 
        });
        file.pipe(createWriteStream(savePath));
        imagenRuta=folderProducto+"/"+filename;
        console.log('archivo guardado en: '+imagenRuta);

      });
      busboy.on('field',(fieldname,val)=>{ //extraemos y guardamos los datos de formData en body. 
        body[fieldname]=val; //fieldname: nombre del campo, val: valor del campo  
      });
      busboy.on('finish', async () => { //al terminar la lectura de los datos del formData se accede a esta seccion del codigo.
        try{
          //let datosAux:CreateProductoDto=body;
          const {marcaId,marcaNombre, ...datosAux}=body;
          const {modelo,habilitarVenta,habilitarRefac,unidadesDis, ...marcaAux}=body
          console.log(datosAux);
          datosAux.imagenProd=imagenRuta;
          if( !datosAux.habilitarRefac || !datosAux.unidadesDis || !datosAux.habilitarVenta || !datosAux.modelo)
          {
            throw new HttpException({
              status:HttpStatus.UNPROCESSABLE_ENTITY,
              error:'Faltan datos obligatorios'
            },HttpStatus.UNPROCESSABLE_ENTITY,{
              cause: 'Faltan datos obligatorios'
            })
          }
          const datosActualizados= await this.productoService.crearProductoServ(
          datosAux,marcaAux,usuarioId);
          //console.log('enviando body',datosAux);
          resolve(datosActualizados);//si todo sale bien. resolvemos la promesa  
        }catch(error){
          rejects(error); //si sale mal. informamos del error 
        }  
      });
    (req as Readable).pipe(busboy)  
    }) 
  }

  @Get('buscarProductos')
   async buscarProductos(@Query() filtros: BuscarProductosDto) {
    if(!filtros.limit || !filtros.page) {
      return new UnauthorizedException('La consulta no cuenta con la informacion necesaria');
    }
      return await this.productoService.buscarProductosServ(filtros);
  }

  @Get(':id')
  buscarProductoPorId(@Param('id') id: string) {
    return this.productoService.buscarProductoPorIdServ(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductoDto: UpdateProductoDto) {
    return this.productoService.update(+id, updateProductoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productoService.remove(+id);
  }
}
