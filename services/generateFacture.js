'use strict';

const PdfPrinter = require("pdfmake/src/printer");
const fs = require("fs");

const join = require("path").join;

const generateFacture = async (data) =>{
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
            content: [
                {
                    table: {
                        body: [
                            [
                                {
                                    table: {
                                        body: [
                                            [
                                                {
                                                    text: 'HOPITAL  GENERAL  DE  DOUALA',
                                                    fontSize: 13,
                                                    border: [false, false, false, false]
                                                },
                                                {
                                                    text: 'BP: 4856  DOUALA',
                                                    fontSize: 13,
                                                    border: [false, false, false, false]
                                                },
                                                {
                                                    text: 'CAMEROUN',
                                                    fontSize: 13,
                                                    border: [false, false, false, false]
                                                },
                                            ],
                                            [
                                                {
                                                    text: `NOM PATIENT`,
                                                    fontSize: 13,
                                                    colSpan: 3,
                                                    border: [false, false, false, false]
                                                },
                                                '',
                                                ''
                                            ]
                                        ]
                                    }
                                }
                            ],
                            [
                                {
                                    table: {
                                        body: [
                                            [
                                                {
                                                    text: `Reçu du \t DD/MM/YYYY \t A HH:MM:SS`,
                                                    fontSize: 13,
                                                    border: [false, false, false, false]
                                                }
                                            ],
                                            [
                                               {
                                                text: `D0SSIER No: \t XXXXXXXXX`,
                                                fontSize: 13,
                                                border: [false, false, false, false]
                                               } 
                                            ],
                                            [
                                                {
                                                     text: `Entré(e) le \t DD/MM/YYYY`,
                                                     fontSize: 13,
                                                     border: [false, false, false, false]
                                                    } 
                                            ],
                                            [
                                                {
                                                 text: `Sorti(e) le \t DD/MM/YYYY`,
                                                 fontSize: 13,
                                                 border: [false, false, false, false]
                                                } 
                                            ]
                                        ]
                                    }
                                }
                            ],
                            [
                                {
                                    table: {
                                        body: [
                                            [
                                                {
                                                    text: `NUMERO DE REGLEMENT \t\t XXXXXXX`,
                                                    fontSize: 13,
                                                    border: [false, false, false, false]
                                                }
                                            ],
                                            [
                                               {
                                                    text: `TYPE DE REGLEMENT \t\t TYPE \t TYPE`,
                                                    fontSize: 13,
                                                    border: [false, false, false, false]
                                               } 
                                            ],
                                            [
                                                {
                                                    text: `MONTANT DU REGLEMENT \t\t DD/MM/YYYY`,
                                                    fontSize: 13,
                                                    border: [false, false, false, false]
                                                } 
                                            ],
                                            [
                                                {
                                                    text: `DATE DE REGLEMENT \t\t DD/MM/YYYY`,
                                                    fontSize: 13,
                                                    border: [false, false, false, false]
                                                } 
                                            ]
                                        ]
                                    }
                                }
                            ]
                        ]
                    }
                },
                {
                    pageBreak: 'before',
                    table: {
                        body: [
                            [
                                {
                                    table: {
                                        body: [
                                            [
                                                {
                                                    text: 'HOPITAL  GENERAL  DE  DOUALA',
                                                    fontSize: 13,
                                                    border: [false, false, false, false]
                                                },
                                                {
                                                    text: 'BP: 4856  DOUALA',
                                                    fontSize: 13,
                                                    border: [false, false, false, false]
                                                },
                                                {
                                                    text: 'CAMEROUN',
                                                    fontSize: 13,
                                                    border: [false, false, false, false]
                                                },
                                            ],
                                            [
                                                {
                                                    text: `NOM PATIENT`,
                                                    fontSize: 13,
                                                    colSpan: 3,
                                                    border: [true, false, false, false]
                                                },
                                                '',
                                                ''
                                            ]
                                        ]
                                    }
                                }
                            ],
                            [
                                {
                                    table: {
                                        body: [
                                            [
                                                {
                                                    text: `Facture du \t DD/MM/YYYY \t A HH:MM:SS`,
                                                    fontSize: 13,
                                                    border: [false, false, false, false]
                                                }
                                            ],
                                            [
                                               {
                                                text: `D0SSIER No: \t XXXXXXXXX`,
                                                fontSize: 13,
                                                border: [false, false, false, false]
                                               } 
                                            ],
                                            [
                                                {
                                                 text: `Sorti(e) le \t DD/MM/YYYY`,
                                                 fontSize: 13,
                                                 border: [false, false, false, false]
                                                } 
                                            ],
                                            [
                                                {
                                                 text: `\t\t\t  ????`,
                                                 fontSize: 13,
                                                 border: [false, false, false, false]
                                                } 
                                            ]
                                        ]
                                    }
                                }
                            ],
                            [
                                {
                                    text: `MEDECIN \t NOM_MEDECIN \t SERVICE_MEDECIN`,
                                    fontSize: 13,
                                    border: [false, false, false, false]
                                }
                            ],
                            [
                                {
                                    table: {
                                        body: [
                                            [
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
                                            ]
                                        ]
                                    }
                                }//Here to append other rows of actes from database
                            ]
                        ]
                    }
                }
            ]
        }

        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(fs.createWriteStream('pdfs/bill.pdf'));
        pdfDoc.end();

    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        throw new Error(error.message)
    }
}

module.exports = generateFacture;