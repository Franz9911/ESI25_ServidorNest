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
    imageHeight?: number;
  }
  
  interface PdfOptions {
    fileName: string;
    title: string;
    logoPath?: string;
    texto?: string;
  }
@Injectable()
export class PdfService {
    constructor(){}
    async GenerarPdfBase<T>(
        data:T[], columnas:TableColumn[], opciones:PdfOptions,dto:any):Promise<string>{
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
        this.AgregarCabecera(doc,opciones.title,opciones.texto); //Titulo
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
        doc.fontSize(8).text('El Shaddai Importaciones', 40, 90 , {
          width: 100,align: 'center'});
    }

    private AgregarCabecera(doc:PDFKit.PDFDocument,titulo:string,texto:string){
      doc.moveUp(8);
      doc.fontSize(15).text(titulo,{align:'center'});
      doc.fontSize(9).text(texto,160,60,{width:400,align:'justify'}).moveDown(3);
    }

    private CargarTabla<T>(doc: PDFKit.PDFDocument, data: T[], columnas: TableColumn[]) {
      let y = doc.y;
      const startX = 50;
      let contardorPagina = 1;
    
      // Encabezado
      let x = startX;
      columnas.forEach((col) => {
        doc.font('Helvetica-Bold').fontSize(10).text(col.header, x, y, { width: col.width || 100 });
        x += col.width || 100;
      });
      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      y = doc.y + 5;
    
      const rowSpacing = 10;
    
      data.forEach((item, index) => {
        let maxHeight = 0;
        const heights: number[] = [];
    
        // ✅ SOLO calcular alturas de la fila, sin imprimir nada
        columnas.forEach((col) => {
          const value = this.obtenerDatosDeObjeto(item, col.key);
          if (col.key === 'imagenProd') {
            // Usar altura fija para la imagen en el cálculo
            heights.push(col.imageHeight || 60);
          } else {
            const text = col.key === 'id' ? `${index + 1}` : this.formatearValor(value, col.key);
            const textHeight = doc.heightOfString(text, { width: col.width || 100 }); //guardamos la altura de cada item
            heights.push(textHeight);
          }
        });
    
        maxHeight = Math.max(...heights); //guardaoms la altura maxima
    
        // Si la fila no cabe en la pagina creaoms una nueva pagina
        if (y + maxHeight + rowSpacing > doc.page.height - 70) {
          if (contardorPagina == 1) {
            this.agregarPiePagina(doc, contardorPagina);
            contardorPagina++;
          }
          doc.addPage();
          if (contardorPagina > 1) {
            this.agregarPiePagina(doc, contardorPagina);
          }
          contardorPagina++;
          y = 60; //reiniciaos y
    
          // Reimprimir encabezado
          x = startX; //reiniciaoms x
          columnas.forEach((col) => {
            doc.font('Helvetica-Bold').fontSize(10)
              .text(col.header, x, y, { width: col.width || 100 });
            x += col.width || 100;
          });
          doc.moveDown(0.5);
          doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
          y = doc.y + 5;
        }
    
        //imprimir fila con coordenadas x, y 
        x = startX;
        columnas.forEach((col) => {
          const value = this.obtenerDatosDeObjeto(item, col.key);
          const colWidth = col.width || 100;
          const imgHeight = col.imageHeight || 60;
    
          if (col.key === 'imagenProd') { //solo valido para productos agregar mas condiciones 
            //Imagen 
            const filePath = join(__dirname, `../../${value}`);
            if (fs.existsSync(filePath)) {
              doc.image(filePath, x, y, {
                width: colWidth - 4,   // margen interno
                height: imgHeight,
                fit: [colWidth - 4, imgHeight], //proporcionar sin desbordar
              });
            } else {
              doc.font('Helvetica').fontSize(8).text('-', x, y, { width: colWidth });
            }
          } else {
            const text = col.key === 'id' ? `${index + 1}` : this.formatearValor(value, col.key);
            doc.font('Helvetica').fontSize(9).text(text, x, y, { width: colWidth });
          }
    
          x += colWidth;
        });
    
        y += maxHeight + rowSpacing;
      });
    }

    agregarPiePagina(doc:PDFKit.PDFDocument,np:number){
      const fecha:Date=new Date()  
      //agregar paginado en esta parte
      doc.moveTo(40, 771.89).lineTo(550, 775.89).stroke(); //pie de pagina
      doc.fontSize(9).text(`pagina ${np}`,40,784,);
      doc.fontSize(9).text(`fecha: ${fecha.toLocaleDateString()} `,480,784,);
    }

    obtenerDatosDeObjeto(obj: any, path: string) {
        return path.split('.').reduce((acc, part) => acc?.[part], obj);
    }
    private formatearValor(value: any, key: string): string {
      if (value == null) return '-';
    
      // Detecta si el valor es una fecha válida
      const esDate = value instanceof Date;
      const esStringFecha = typeof value === 'string' && !isNaN(Date.parse(value));
    
      if (esDate || esStringFecha) {
        const fecha = new Date(value);
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
      }
    
      return String(value);
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
        this.AgregarLogo(doc,'logoESI.png');
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

