'use strict';

const PdfPrinter = require('pdfmake');
const path = require("path");

// generate pdf document 
// Input: an object @data with keys ''
// Output: if success: pdfDocument object [@Readetable stream] 
//  else: throw an error 
const generateRecus = async (data = {}, isCopy = false) =>{
    try {
        const fonts = {
            Roboto: {
                normal: path.resolve('fonts/Poppins-Regular.ttf'),
                bold:   path.resolve('fonts/Poppins-Medium.ttf'),
                italics: path.resolve('fonts/Poppins-ExtraLight.ttf'),
                bolditalics: path.resolve('fonts/Poppins-Light.ttf'),
            }
        };
        
        const printer = new PdfPrinter(fonts);
        
        const docDefinition = {
            pageOrientation: 'landscape',
            pageSize: "A5",
            background: [ 
                {
                    image: `${path.join(path.resolve('assets'), 'images', 'hgd-background.png')}`,
                    width: 200,
                    opacity: 0.5,
                    absolutePosition: { x: 120, y: 80 }
                },
                {
                    text: `${isCopy ? "DUPLICATA":""}`,
                    fontSize: 60,
                    opacity: 0.3,
                    absolutePosition: { x: 170, y: 100 }
                },
            ],
            content: [
                {
                    table: {
                        margin: [5, 10, 5, 20],
                        widths: [150, "*", "*", "*", "*", "*"],
                        body: [
                            [
                                {
                                    text: 'HOPITAL  GENERAL  DE  DOUALA',
                                    fontSize: 13,
                                    colSpan: 3,
                                    border: [true, true, true, false]
                                },
                                {}, 
                                {},
                                {
                                    text: `${data.LIBRGLT || "NOM PATIENT"}`,
                                    fontSize: 13,
                                    colSpan: 3,
                                    rowSpan: 2,
                                    border: [true, true, true, true]
                                },
                                {},
                                {},
                                
                            ],
                            [
                                {
                                    text: 'BP: 4856  DOUALA, CAMEROUN',
                                    fontSize: 13,
                                    colSpan: 3,
                                    border: [true, false, true, true]
                                }, {}, {}, {}, {}, {}
                            ],
                            [
                                {
                                    text: `Reçu du`,
                                    fontSize: 13,
                                    border: [true, true, false, false]
                                }, {
                                    text: `${data.dateImpression || ""}`,
                                    fontSize: 13,
                                    bold: true,
                                    colSpan: 2,
                                    border: [false, true, false, false]
                                }, {},
                                {
                                    text: `A`,
                                    fontSize: 13,
                                    border: [false, true, false, false] 
                                }, {
                                    text: ` ${data.heureImpression || ""}`,
                                    fontSize: 13,
                                    bold: true,
                                    colSpan: 2,
                                    border: [false, true, true, false]
                                }, {}
                            ],
                            [
                                {
                                    text: `D0SSIER No: `,
                                    fontSize: 13,
                                    colSpan: 2,
                                    border: [true, false, false, false]
                                },
                                {},
                                {
                                    text: `${data.NUMDOS || ""}`,
                                    fontSize: 13,
                                    alignment: 'left',
                                    bold: true,
                                    colSpan: 4,
                                    border: [false, false, true, false]
                                }, {}, {}, {}
                            ],
                            [
                                {
                                    text: `Entré(e) le \t \t ${data.DATEEH || ""}`,
                                    fontSize: 13,
                                    colSpan: 3,
                                    border: [true, false, false, true]
                                }, {}, {},
                                {
                                    text: `Sorti(e) le \t \t ${data.DATESH || ""}`,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [false, false, true, true]
                                }, {}, {}
                            ],
                            [
                                {
                                    text: `NUMERO DE REGLEMENT `,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [true, true, false, false]
                                }, {}, {},
                                {
                                    text: `${data.NUMRGLT || ""}`,
                                    fontSize: 14,
                                    alignment: 'left',
                                    bold: true,
                                    colSpan: 3,
                                    border: [false, false, true, false]
                                }, {}, {}
                            ],
                            [
                                {
                                    text: `TYPE DE REGLEMENT `,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [true, false, false, false]
                                }, {}, {}, 
                                {
                                    text: `${data.TYPE || ""}`,
                                    fontSize: 13,
                                    bold: true,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [false, false, true, false]
                                },
                                {}, {}
                            ],
                            [
                                {
                                    text: `MONTANT DU REGLEMENT `,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [true, false, false, false]
                                }, {}, {},
                                {
                                    text: `${data.MNTREG || ""} XAF`,
                                    fontSize: 15,
                                    alignment: 'left',
                                    bold: true,
                                    colSpan: 3,
                                    border: [false, false, true, false]
                                }, {}, {},
                            ],
                            [
                                {
                                    text: `DATE DE REGLEMENT `,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [true, false, false, true]
                                },  {}, {},
                                {
                                    text: `${data.DATERGLT || ""}`,
                                    fontSize: 14,
                                    alignment: 'left',
                                    bold: true,
                                    colSpan: 3,
                                    border: [false, false, true, true]
                                },  {}, {}
                            ]
                        ]
                    }
                }
            ]
        }

        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        return pdfDoc;
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        throw new Error(error.message)
    }
}

module.exports = generateRecus;