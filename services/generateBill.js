const PdfPrinter = require("pdfmake/src/printer");

const fs = require("fs");

const join = require("path").join;

const generateBill = async (data) =>{
    try {
        var fonts = {
            Roboto: {
                normal: 'fonts/Roboto-Regular.ttf',
                bold: 'fonts/Roboto-Medium.ttf',
                italics: 'fonts/Roboto-Italic.ttf',
                bolditalics: 'fonts/Roboto-MediumItalic.ttf'
            }
        };
        
        const printer = PdfPrinter(fonts)
        const docDefinition = {

        }

        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(fs.createWriteStream('pdfs/bill.pdf'));
        pdfDoc.end();

    } catch (error) {
        console.log(error);
        throw new Error(error.message)
    }
}