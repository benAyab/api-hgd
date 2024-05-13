'use strict';

const PdfPrinter = require('pdfmake');
const fs = require("fs");

const path = require("path");

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
        
        const printer = new PdfPrinter(fonts)
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
                                    border: [true, true, true, false]
                                },
                                {}, 
                                {},
                                {
                                    text: `NOM PATIENT`,
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
                                    border: [true, false, false, true]
                                }, {}, {}, {}, {}, {}
                            ],
                            [
                                {
                                    text: `Facture du \t DD/MM/YYYY`,
                                    fontSize: 13,
                                    colSpan: 3,
                                    border: [true, true, false, true]
                                }, {}, {},
                                {
                                    text: ` A  HH:MM:SS`,
                                    fontSize: 13,
                                    colSpan: 3,
                                    border: [false, true, true, true]
                                }, {}, {}
                            ],
                            [
                                {
                                    text: `D0SSIER No: `,
                                    fontSize: 13,
                                    colSpan: 2,
                                    border: [true, true, false, true]
                                },
                                {},
                                {
                                    text: `XXXXXXXXX`,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 4,
                                    border: [false, true, true, true]
                                }, {}, {}, {}
                            ],
                            [
                                {
                                    text: `Entré(e) le \t DD/MM/YYYY`,
                                    fontSize: 13,
                                    colSpan: 3,
                                    border: [true, true, false, true]
                                }, {}, {},
                                {
                                    text: `Sorti(e) le \t DD/MM/YYYY`,
                                    fontSize: 13,
                                    alignment: 'left',
                                    colSpan: 3,
                                    border: [false, true, true, true]
                                }, {}, {}
                            ],
                            [
                                {
                                    text: `MEDECIN `,
                                    fontSize: 13,
                                    colSpan: 2,
                                    border: [true, true, false, false]
                                }, {},
                                {
                                    text: `\t SERVICE_MEDECIN`,
                                    fontSize: 13,
                                    colSpan: 4,
                                    border: [false, true, true, false]
                                }, {}, {}, {}
                            ],
                            listActes(fakeActes)[0]
                        ]
                    }
                }
            ]
        }

        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(fs.createWriteStream(path.join(path.resolve('pdfs'), 'bill.pdf' )));
        pdfDoc.end();

    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        throw new Error(error.message)
    }
}

//just for test
const fakeActes = [
    {
        date: '12/03/2023',
        nomTarif: "Examen URO-ges",
        pu: 2300,
        qte: 2,
        tva: 0,
        total: 4600
    },
    {
        date: '10/03/2024',
        nomTarif: "Radiologie thorax",
        pu: 7000,
        qte: 1,
        tva: 0,
        total: 7000
    },
    {
        date: '22/04/2024',
        nomTarif: "Examen URO-ges",
        pu: 2300,
        qte: 1,
        tva: 0,
        total: 2300
    },
    {
        date: '07/12/2023',
        nomTarif: "Examen uro-gastrique",
        pu: 4000,
        qte: 1,
        tva: 0,
        total: 4000
    }
]

const listActes = (actes = []) =>{
    let actesRows = [];
    actesRows.push([
        {
            text: `Date`,
            fontSize: 13,
            //border: [false, false, false, false]
        },
       {
            text: `Actes`,
            fontSize: 13,
            //border: [false, false, false, false]
       }, 
        {
            text: `P.U`,
            fontSize: 13,
            //border: [false, false, false, false]
        }, 
        {
            text: `Qté`,
            fontSize: 13,
            //border: [false, false, false, false]
        },
        {
            text: `TVA`,
            fontSize: 13,
            //border: [false, false, false, false]
        },
        {
            text: `TOTAL`,
            fontSize: 13,
            //border: [false, false, false, false]
        } 
    ]);

  actes.forEach(acte =>{
      const row =  [
            {
                text: `${acte.date}`,
                fontSize: 13,
                //border: [false, false, false, false]
            },
            {
                text: `${acte.nomTarif}`,
                fontSize: 13,
                //border: [false, false, false, false]
            }, 
            {
                text: `${acte.pu}`,
                fontSize: 13,
                //border: [false, false, false, false]
            }, 
            {
                text: `${acte.qte}`,
                fontSize: 13,
                //border: [false, false, false, false]
            },
            {
                text: `${acte.tva}`,
                fontSize: 13,
                //border: [false, false, false, false]
            },
            {
                text: `${acte.total}`,
                fontSize: 13,
                //border: [false, false, false, false]
            } 
        ];

        actesRows.push(row)
    });

    return actesRows
}

module.exports = generateFacture;