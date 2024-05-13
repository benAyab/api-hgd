'use strict';

const PdfPrinter = require('pdfmake');
const fs = require("fs");

const path = require("path");

const generateRecus = async (data = {}) =>{
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
            content: [
                {
                    table: {
                        body: [
                            [
                                {
                                    text: 'HOPITAL  GENERAL  DE  DOUALA',
                                    fontSize: 13,
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                },
                                {}, 
                                {},
                                {
                                    text: `NOM PATIENT`,
                                    fontSize: 13,
                                    colSpan: 3,
                                    rowSpan: 2,
                                    border: [false, false, false, false]
                                },
                                {},
                                {},
                                
                            ],
                            [
                                {
                                    text: 'BP: 4856  DOUALA, CAMEROUN',
                                    fontSize: 13,
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                }, {}, {}, {}, {}, {}
                            ],
                            [
                                {
                                    text: `Reçu du \t DD/MM/YYYY`,
                                    fontSize: 13,
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                }, {}, {},
                                {
                                    text: ` A  HH:MM:SS`,
                                    fontSize: 13,
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                }, {}, {}
                            ],
                            [
                                {
                                    text: `D0SSIER No: `,
                                    fontSize: 13,
                                    colSpan: 2,
                                    border: [false, false, false, false]
                                },
                                {},
                                {
                                    text: `XXXXXXXXX`,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 4,
                                    border: [false, false, false, false]
                                }, {}, {}, {}
                            ],
                            [
                                {
                                    text: `Entré(e) le \t DD/MM/YYYY`,
                                    fontSize: 13,
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                }, {}, {},
                                {
                                    text: `Sorti(e) le \t DD/MM/YYYY`,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                }, {}, {}
                            ],
                            [
                                {
                                    text: `NUMERO DE REGLEMENT `,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                }, {}, {},
                                {
                                    text: `XXXXXXX`,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                }, {}, {}
                            ],
                            [
                                {
                                    text: `TYPE DE REGLEMENT `,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                }, {}, {}, 
                                {
                                    text: `RC`,
                                    fontSize: 13,
                                    alignment: 'right',
                                    border: [false, false, false, false]
                                },
                                {
                                    text: `RAP`,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 2,
                                    border: [false, false, false, false]
                                }, {}
                            ],
                            [
                                {
                                    text: `MONTANT DU REGLEMENT `,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                }, {}, {},
                                {
                                    text: ` XXXX`,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                }, {}, {},
                            ],
                            [
                                {
                                    text: `DATE DE REGLEMENT `,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                },  {}, {},
                                {
                                    text: `DD/MM/YYYY`,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                },  {}, {}
                            ]
                        ]
                    }
                }
            ]
        }

        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(fs.createWriteStream(path.join(path.resolve('pdfs'), 'recus.pdf' )));
        pdfDoc.end();

    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        throw new Error(error.message)
    }
}

module.exports = generateRecus;