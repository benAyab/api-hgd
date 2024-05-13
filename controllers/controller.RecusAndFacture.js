'use strict'

const oracledb = require('oracledb');
const generateRcus = require('../services/generateRecus');
const generateFacture = require('../services/generateFacture');

exports.getFactureDetail = async (req, res) =>{
    try {
        if(!req.params.numDossier){
            return res.status(400).json({error: 'INVALID_PARAM', message: "Missing NumDoosier"})
        }

        //TODO 
        //fecth dossier and return if exist
        const detail_dossier_and_patient_query = `SELECT ghdossier.numdos, ghdossier.catdos, ghdossier.dateeh, ghdossier.datresh, ghdossier.nompat, ghdossier.prepat
        FROM ghdossier
        INNER JOIN `

        const d = new Date();
        console.log("Local date String: ", d.toLocaleDateString())
        console.log("Local  String: ", d.toLocaleString())

        await generateFacture();
        await generateRcus();

        return res.status(200).json({data: 'facture et recus generes'});
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        return res.status(500).json({error: 'INTERNAL_ERROR', message: "Internal server error"})
    }
}

//To generate a bill when payment successfull
exports.generateAndDownloadFacture = async (req, res) =>{

}