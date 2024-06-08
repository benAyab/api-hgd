'use strict';

const PdfPrinter = require('pdfmake');
const Utils = require("../helpers/utils");

const path = require("path");

// generate pdf document 
// Input: an object @data with keys 
// Output: if success: pdfDocument object [@Readatable stream] 
//  else: throw an error 
const generateFacture = async (data = {}) =>{
    try {
        const fonts = {
            Roboto: {
                normal: path.resolve('fonts/Poppins-Regular.ttf'),
                bold:   path.resolve('fonts/Poppins-Medium.ttf'),
                italics: path.resolve('fonts/Poppins-ExtraLight.ttf'),
                bolditalics: path.resolve('fonts/Poppins-Light.ttf'),
            }
        };
        
        //instanciate a new PdfPrinter to hold our future document
        const printer = new PdfPrinter(fonts)
        const docDefinition = {
            background: [ 
                {
                    image: `${path.join(path.resolve('assets'), 'images', 'hgd-background.png')}`,
                    width: 200,
                    opacity: 0.5,
                    absolutePosition: { x: 80, y: 50 }
                }
            ],
            content: [
                {
                    table: {
                        widths: [100, 120, 60, 40, 50, 70],
                        body: getContent(data)
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

//make pdf template function
// Input: an object with all data from database
// Output: an array @rows of lines to be print
// 
const getContent = (data) =>{
    //rows to hold lines of text
    let rows = [];

    rows.push([
        {
            text: 'HOPITAL  GENERAL  DE  DOUALA',
            fontSize: 13,
            colSpan: 3,
            border: [true, true, true, false]
        },
        {}, 
        {},
        {
            text: `${data.LIBRGLT || ''}`,
            fontSize: 13,
            bold: true,
            alignment: 'center',
            colSpan: 3,
            rowSpan: 2,
            border: [true, true, true, true]
        },
        {},
        {},
        
    ]);
    rows.push([
        {
            text: 'BP: 4856  DOUALA, CAMEROUN',
            fontSize: 13,
            colSpan: 3,
            border: [true, false, false, true]
        }, {}, {}, {}, {}, {}
    ]);
    rows.push([
        {
            text: `Facture du `,
            fontSize: 13,
            border: [true, true, false, true]
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
    ]);
    rows.push([
        {
            text: `D0SSIER No: `,
            fontSize: 13,
            colSpan: 2,
            border: [true, true, false, false]
        },
        {},
        {
            text: `${data.NUMDOS || ""}`,
            fontSize: 13,
            alignment: 'left',
            bold: true,
            colSpan: 4,
            border: [false, true, true, false]
        }, {}, {}, {}
    ]);
    rows.push([
        {
            text: `Entré(e) le`,
            fontSize: 13,
            colSpan: 2,
            border: [true, false, false, false]
        }, {},
        {
            text: `${data.DATEEH || ""}`,
            fontSize: 13,
            colSpan: 4,
            bold: true,
            border: [false, false, true, false]
        }, {}, {}, {}
    ]);
    rows.push([
        {
            text: `Sorti(e) le`,
            fontSize: 13,
            colSpan: 2,
            alignment: 'left',
            border: [true, false, false, true]
        },{},
        {
            text: `${data.DATESH || ""}`,
            fontSize: 13,
            bold: true,
            alignment: 'left',
            colSpan: 4,
            border: [false, false, true, true]
        }, {}, {}, {}
    ]);
    rows.push([
        {
            text: `MEDECIN `,
            fontSize: 13,
            colSpan: 2,
            border: [true, true, false, true]
        }, {},
        {
            text: `\t SERVICE_MEDECIN`,
            fontSize: 13,
            colSpan: 4,
            border: [false, true, true, true]
        }, {}, {}, {}
    ])
    rows.push([
        {
            text: `Date`,
            bold: true,
            fontSize: 13,
            //border: [false, false, false, false]
        },
       {
            text: `Actes`,
            bold: true,
            alignment: 'center',
            fontSize: 13,
            //border: [false, false, false, false]
       }, 
        {
            text: `P.U`,
            bold: true,
            alignment: 'center',
            fontSize: 13,
            //border: [false, false, false, false]
        }, 
        {
            text: `Qté`,
            bold: true,
            alignment: 'center',
            fontSize: 13,
            //border: [false, false, false, false]
        },
        {
            text: `TVA`,
            bold: true,
            alignment: 'center',
            fontSize: 13,
            //border: [false, false, false, false]
        },
        {
            text: `TOTAL`,
            bold: true,
            alignment: 'center',
            fontSize: 13,
            //border: [false, false, false, false]
        } 
    ]);

    data.actes.forEach(acte =>{
      const row =  [
            {
                text: `${Utils.getGivingDateInDDMMYYYY(acte.DATEFR)}`,
                fontSize: 13
            },
            {
                text: `${acte.NOMTARIF}`,
                fontSize: 13
            }, 
            {
                text: `${acte.PU}`,
                fontSize: 13
            }, 
            {
                text: `${acte.QTEFR}`,
                fontSize: 13
            },
            {
                text: `${acte.TAUXBPC}`,
                fontSize: 13
            },
            {
                text: `${acte.TT_PAT}`,
                fontSize: 13
            } 
        ];

        rows.push(row)
    });

    return rows;
}

module.exports = generateFacture;