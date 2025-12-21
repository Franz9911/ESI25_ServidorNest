import { Injectable, StreamableFile } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import * as PDFDocument from 'pdfkit';
import { FindProveedorDto } from 'src/proveedor/dto/find-proveedor.dto';
import { dot } from 'node:test/reporters';


interface TableColumn {
    header: string;
    key: string;
    width?: number;
  }
  
  interface PdfOptions {
    fileName: string;
    title: string;
    logoPath?: string;
  }
@Injectable()
export class PdfService {
    constructor(){}
    async GenerarPdfBase<T>(
        data:T[], columnas:TableColumn[], opciones:PdfOptions,dto:FindProveedorDto):Promise<string>{
        //console.log("base",columnas)
        const filePath=join(__dirname,`../../uploads/pdf/${opciones.fileName}`)
        //crear El Documento
        console.log("path: ",filePath);
        const doc=new PDFDocument({
          margin:40,
          size:'A4',
          //layout: 'landscape' 
        });
       return new Promise((resolve,reject)=>{
        const stream =fs.createWriteStream(filePath);
        doc.pipe(stream);

        this.AgregarLogo(doc,opciones.logoPath)
        this.AgregarCabecera(doc,opciones.title,dto); //Titulo
        this.CargarTabla(doc,data,columnas) //cuerpo tabla
        doc.end();

        stream.on('finish',()=>{
          console.log('Pdf generado correctamente!!');
          resolve(filePath);
        });
        stream.on('error',(err)=>{
          console.log(err);
          reject(err);
        })
       })
    }

    private AgregarLogo(doc:PDFKit.PDFDocument, logoPath?:string){
        if(!logoPath)return;
        const absolutePath=join(__dirname,'../../usuarios',logoPath);    
        if(fs.existsSync(absolutePath)){ //
            doc.image(absolutePath,40,40,{width:100});
        } 
        doc.fontSize(8).text('El Shaddai Importaciones', 40, 115 , {
          width: 100,align: 'center'});
    }

    private AgregarCabecera(doc:PDFKit.PDFDocument,titulo:string,dto:FindProveedorDto){
      doc.moveUp(8);
      doc.fontSize(15).text(titulo,{align:'center'});
      doc.fontSize(9).text(`A continuación, se presenta la información de los proveedores de la empresa ESI, 
      filtrada según los siguientes criterios: Estado: ${dto.estado ||'No aplica' }, 
      Razón social: ${dto.nombreEmpresa ||'No aplica'}, Período de registro: del ${dto.fechaInicio ||'No aplica'} al
       ${dto.fechaFin ||'No aplica'}.`,150,70,{width:400,align:'justify'}).moveDown(3);
    }

    private CargarTabla<T>(doc: PDFKit.PDFDocument, data: T[], columnas: TableColumn[],) {
      let y = doc.y;
      const startX = 50;
      let contardorPagina=1;
    
      //Encabezado
      let x = startX;
      columnas.forEach((col) => {
        doc.font('Helvetica-Bold').fontSize(10).text(col.header, x, y, { width: col.width || 100 });
        x += col.width || 100;
      });
      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      y = doc.y + 5;
    
      const rowSpacing = 5; //espacio entre filas
    
      //Filas
      data.forEach((item, index) => {
        let x = startX;
        let maxHeight = 0; //altura máxima de la fila
    
        // Calcular altura máxima de la fila
        const heights: number[] = [];
        columnas.forEach((col) => {
          const value = this.obtenerEmpresaDatos(item, col.key);
          const text = col.key === 'id' ? `${index + 1}` : String(value ?? '-');
    
          // Medir altura del texto
          const textOptions = { width: col.width || 100 };
          const textHeight = doc.heightOfString(text, textOptions); //Mide cuanto espacio ocupa el texto dentro de la celda
          heights.push(textHeight); //guarda la altura de cada celda 
        });
        maxHeight = Math.max(...heights);//obtener la altura máxima real de la fila
    
        // Verificar si la fila cabe en la página
        if (y + maxHeight + rowSpacing > doc.page.height - 70) {
          if(contardorPagina==1){ //solo imprime para la primera pagina
            this.agregarPiePagina(doc,contardorPagina);
            contardorPagina=contardorPagina+1;
          }         
          doc.addPage();
          if(contardorPagina>1){ //imprime desde la pagina 2 hasta la ultima
            this.agregarPiePagina(doc,contardorPagina);
          }
          contardorPagina=contardorPagina+1;
          y = 60;
    
          // volver a imprimir encabezado
          x = startX;
          columnas.forEach((col) => {
            doc.font('Helvetica-Bold').fontSize(10)
               .text(col.header, x, y, { width: col.width || 100 });
            x += col.width || 100;
          });
          doc.moveDown(0.5);
          doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
          y = doc.y + 5;
        }
    
        // Imprimir fila
        x = startX;
        columnas.forEach((col) => {
          const value = this.obtenerEmpresaDatos(item, col.key);
          const text = col.key === 'id' ? `${index + 1}` : String(value ?? '-');  
          doc.font('Helvetica').fontSize(9).text(text, x, y, { width: col.width || 100 });
          x += col.width || 100;
        });
        y += maxHeight + rowSpacing; //avanzar a la siguiente fila
      });
      
    }

    agregarPiePagina(doc:PDFKit.PDFDocument,np:number){
      const fecha:Date=new Date()  
      //agregar paginado en esta parte
      doc.moveTo(40, 771.89).lineTo(550, 775.89).stroke(); //pie de pagina
      doc.fontSize(9).text(`pagina ${np}`,40,784,);
      doc.fontSize(9).text(`fecha: ${fecha.toLocaleDateString()} `,480,784,);
    }
    obtenerEmpresaDatos(obj: any, path: string) {
        return path.split('.').reduce((acc, part) => acc?.[part], obj);
    }
    generarCotizacionPdf(cotizacion:any,detalles:any,columnas:any):Promise<string>{
      const fileName=`OC${cotizacion.compra.id}_${cotizacion.proveedor.empresa.razonSocial}.pdf`;
      //const filePath=join(__dirname,`../../uploads/pdf/cotizaciones/OC${cotizacion.compra.id}/${fileName}`);
      const dirPath = join(__dirname, `../../uploads/ordenCompra/OC${cotizacion.compra.id}/cotizaciones`);
      const dirPathRespuestas=join(__dirname, `../../uploads/ordenCompra/OC${cotizacion.compra.id}/respuestas`);
      const filePath = join(dirPath, fileName);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        fs.mkdirSync(dirPathRespuestas,{recursive:true});
      }
      const doc=new PDFDocument({
        margin:40,
        size:'a4',
      });

      return new Promise((resolve,reject)=>{
        const stream =fs.createWriteStream(filePath);
        doc.pipe(stream);
        this.AgregarLogo(doc,'kuma2.png');
        doc.fontSize(16).text('Solicitud de Cotización ', { align: 'center' });
        doc.moveDown();
        doc.fontSize(11).text(`Proveedor: ${cotizacion.proveedor.empresa.razonSocial}`);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`);
        doc.fontSize(9).text('La empresa El Shaddai Importaciones solicita de la manera mas amable la presentacion de la cotizacion de los siguientes productos:');
        doc.moveDown(2);

        this.CargarTabla(doc,detalles,columnas);

        doc.end();
        stream.on('finish',()=> resolve(`OC${cotizacion.compra.id}`));
        stream.on('error',reject);
      }); 
    }
}

