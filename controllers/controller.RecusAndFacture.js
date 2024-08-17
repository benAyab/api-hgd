'use strict'

const oracledb = require('oracledb');

const generateRcus = require('../services/generateRecus');
const generateFacture = require('../services/generateFacture');
const detailDossier = require("../services/service.getDetailDossier");
const appendToLog = require("../services/service.log");

const dbConfig = require('../config/database');
const Utils = require("../helpers/utils");

//@controller 
//for getting data and prints pdf document of bill
//Input: an object req(@request) that handle incomming resquest
//Input: an object res(@response) response to client
//Output: a stream data 
//thrown an error if failed
exports.generateAndDownloadRecus = async (req, res) =>{
    let connection;
    try {
        if(!req.params.numrecus || isNaN(req.params.numrecus)){
            return res.status(400).json({error: 'INVALID_PARAM', message: "Numéro du réglèment invalide"});
        }

        //logging event to debug log file
        appendToLog("[info] génération de reçu...");
        // after validation, now open connection to database
        oracledb.initOracleClient();
        connection = await oracledb.getConnection(dbConfig);

        
            //fetching payment and patient infos from database query
            const sql = `SELECT ghrgltdet.NUMRGLT AS numrglt, ghrgltdet.NUMDOS AS numdos, ghrgltdet.DATERGLT AS daterglt, ghrgltdet.MNTREG AS mntreg, ghrgltdet.TYPE AS type, ghrgltdet.LIBRGLT AS librglt, ghdossier.NOMPAT AS NOMPAT, ghdossier.PREPAT AS PREPAT, ghdossier.DATEEH AS dateeh, ghdossier.DATESH AS datesh FROM ${process.env.DB_USER}.ghrgltdet LEFT JOIN ${process.env.DB_USER}.ghdossier ON (ghdossier.NUMDOS = ghrgltdet.NUMDOS) WHERE ghrgltdet.NUMRGLT = :numrglt`;
            const result = await connection.execute(sql,
                {numrglt: req.params.numrecus},
                { outFormat: oracledb.OUT_FORMAT_OBJECT}  // object format
            );

            //If we don't get result, throw error
            if(!result.rows || result.rows.length === 0){
                appendToLog("[error] Echec de récupération des détails sur le règlement");
                return res.status(404).json({error: 'NOT_FOUND_REGLEMENT', message: "Echec de récupération des détails sur le règlement"});
            }

            const detailData = result.rows[0];
            const nompat = `${detailData.NOMPAT? detailData.NOMPAT : ""} ${detailData.PREPAT? detailData.PREPAT : ""}`;

            const dateImpression = Utils.getDateInDDMonthNameYYYY(Date.now());
            const heureImpression = Utils.getTimeNowInHHMMSS();

            const recusData = {
                LIBRGLT: nompat,
                dateImpression,
                heureImpression,
                NUMDOS: detailData.NUMDOS,
                DATEEH: Utils.getDateInDDMonthNameYYYY(detailData.DATEEH),
                DATESH: Utils.getDateInDDMonthNameYYYY(detailData.DATESH),
                NUMRGLT: detailData.NUMRGLT,
                TYPE: detailData.TYPE,
                MNTREG: detailData.MNTREG,
                DATERGLT: Utils.getDateInDDMonthNameYYYY(detailData.DATERGLT)
            }

        // on recupere le nombre d'impression du recus pr savoir s'il faaut generer un duplicata
        const checkPreviousPrintedSQL = `SELECT NUMBER_PRINTS FROM ${process.env.DB_USER}.GHRGLTDETDIGI WHERE NUMRGLT = :numrglt`
        
        const checkQueryResult = await connection.execute(checkPreviousPrintedSQL,
            {numrglt: req.params.numrecus},
            { outFormat: oracledb.OUT_FORMAT_OBJECT}  // object format
        );

        let nbrePrints  = 0;
        if(checkQueryResult.rows && (checkQueryResult.rows.length > 0) && (checkQueryResult.rows[0].NUMBER_PRINTS > 0)){
            nbrePrints = checkQueryResult.rows[0].NUMBER_PRINTS;
        }
        ++nbrePrints;

        let dprt = require("moment")().format().replace("T", " ");
        dprt = dprt.replace("+", " +");
        dprt = dprt.replaceAll("-", "/");

        //TIMESTAMP 'YYYY-MM-DD HH24:MI:SS.FF TZH:TZM'
        // datePrint: 'TO_DATE(:dprtDD/MM/YYYY HH24:MI:SS)'

        const updateDIGITrx = `UPDATE ${process.env.DB_USER}.GHRGLTDETDIGI SET NUMBER_PRINTS = :nbrPrt WHERE NUMRGLT = :numrglt`;

        await connection.execute(updateDIGITrx,
            {   nbrPrt: nbrePrints, 
                numrglt: req.params.numrecus
                },
            { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true}
        )
    
            let isDuplicata = false; 
            if(nbrePrints > 1){
                isDuplicata = true;
            }
            appendToLog("[info] Reçu généré avec le numéro: "+req.params.numrecus)
            //on genere le fichier pdf de la facture et on stream les data sur la reponse reponse
            var pdfDoc = await generateRcus(recusData, isDuplicata);

            res.statusCode = 200;
            res.setHeader('Content-type', 'application/pdf');

            pdfDoc.pipe(res);
            pdfDoc.end();
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        appendToLog("[error] "+error.message);
        return res.status(500).json({error: 'INTERNAL_ERROR', message: "Internal server error"})
    }finally {
        if(connection){
            try{
                await connection.close();
            }catch(error){
                if(process.env.CONTEXT_EXEC === 'development'){
                    console.log(error);
                }
                appendToLog("[error] "+error.message);
                return res.status(500).json({error: 'INTERNAL_ERROR', message: "Internal server error"})
            }
        }
    }
}


//@controller 
//To generate a bill when payment successfull
//Input: an object req(@request) that handle incomming resquest
//Input: an object res(@response) response to client
//Output: a stream data 
//thrown an error if failed
exports.generateAndDownloadFacture = async (req, res) =>{
    try {
        if(!req.params.numdossier || isNaN(req.params.numdossier)){
            return res.status(400).json({error: 'INVALID_PARAM', message: "Numéro du dossier invalide"});
        }
    
        const detailData = await detailDossier(req.params.numdossier);
        appendToLog("[info] Génération facture No dossier "+req.params.numdossier);
        if(!detailData){
            appendToLog("[error] Echec génération facture, dossier introuvable");
            return res.status(404).json({error: 'DOSSIER_INTROUVABLE', message: "Dossier introuvable"});
        }
    
        const nompat = `${detailData.NOMPAT? detailData.NOMPAT : ""} ${detailData.PREPAT? detailData.PREPAT : ""}`;
        
        const dateImpression = Utils.getDateInDDMonthNameYYYY(Date.now());
        const heureImpression = Utils.getTimeNowInHHMMSS();
        
        //bill data from database to print
        //@keys LIBRGLT: patient fullname
        //     dateImpression, heureImpression:  date and hour of printint 
        const factureData = {
            LIBRGLT: nompat,
            dateImpression,
            heureImpression,
            NUMDOS: detailData.NUMDOS,
            DATEEH: Utils.getDateInDDMonthNameYYYY(detailData.DATEEH),
            DATESH: Utils.getDateInDDMonthNameYYYY(detailData.DATESH),
            MNTREG: detailData.amount,
            actes: detailData.actes
        }
        
        var pdfDoc = await generateFacture(factureData);
    
        res.statusCode = 200;
        res.setHeader('Content-type', 'application/pdf');
        pdfDoc.pipe(res);
        
        pdfDoc.end();
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        appendToLog("[error] "+error.message);
        return res.status(500).json({error: 'INTERNAL_ERROR', message: "Internal server error"})
    }
}