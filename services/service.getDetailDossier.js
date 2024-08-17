'use strict'

const oracledb = require('oracledb');
const dbConfig = require('../config/database');

const appendToLog = require("./service.log");

exports.getDetailDossier = async (numDos = 0) =>{
    let connection;
    try {
        // after validation, now open connection to database
        oracledb.initOracleClient();
        connection = await oracledb.getConnection(dbConfig);
        //fecth "dossier" and return if exists

        appendToLog("[info] Récupération détail dossier No: "+numDos);

        const sqlDetailDossier = `SELECT  NUMDOS, CATDOS,  ETAT, NOMPAT, DATEEH, DATESH, PREPAT, DDN, SEXE, TAUXSEJ, TAUXHON  FROM ${process.env.DB_USER}.ghdossier WHERE NUMDOS = :numdos AND ETAT = :etat`;
        
        const sqlActes = `SELECT CODMED, DATEFR, QTEFR, TAUXBPC, PU, NOMTARIF, TT_PAT FROM ${process.env.DB_USER}.ghfrais WHERE NUMDOS = :numdos`;

        const sqlRglt = `SELECT SUM(MNTREG) AS MNTTOTALREG FROM ${process.env.DB_USER}.ghrgltdet WHERE NUMDOS = :numdos  GROUP BY NUMDOS`;
        
        //fetching "Dossier" detail
        const resultDossier = await connection.execute(sqlDetailDossier,
            {numdos: numDos, etat: "E"},
            { outFormat: oracledb.OUT_FORMAT_OBJECT}  // object format
        );
        
        //fecthing all acts of this "Dossier"
        const result = await connection.execute(sqlActes, 
            {numdos: numDos },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // fecthing all payment concluded for this "Dossier"
        const resultRglt = await connection.execute(sqlRglt,
            {numdos: numDos},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        //If we don't find any "dossier" from database
        if( resultDossier.rows && resultDossier.rows.length === 0){
            return null;        
        }

        const dos = resultDossier.rows[0];
        //
        const canEditAmount = (dos.CATDOS == "3" || dos.CATDOS == "4") ? 0 : 1;

        //for total amount paid by patient
        let totalAmountPaid = 0;
        let  data = {...dos, canEditAmount, actes: (result.rows && result.rows.length > 0)? result.rows : [] };

        //if(result.rows && canEditAmount === 0){
        const amount = result.rows.reduce( (prev, acte) =>  prev + acte.TT_PAT, 0.0);

        totalAmountPaid = (resultRglt.rows &&  resultRglt.rows.length > 0) ? resultRglt.rows[0].MNTTOTALREG : 0;
        const amountToPay = amount - totalAmountPaid;

        data["amount"] = amount;
        data["totalAmountPaid"] = totalAmountPaid;
        data["amountToPay"] = amountToPay;

        return data;
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        appendToLog("[error] "+error.message);
        throw new Error("Erreur lors de récupération des détails du dossier");
    }finally {
        if(connection){
            try{
                await connection.close();
            }catch(error){
                if(process.env.CONTEXT_EXEC === 'development'){
                    console.log(error);
                }
                appendToLog("[info] "+error.message);
                throw new Error(error.message);
            }
        }
    }
}

exports.getDetail2 = async (numDos = 0) =>{
    let connection;
    try {
        // after validation, now open connection to database
        oracledb.initOracleClient();
        connection = await oracledb.getConnection(dbConfig);
        //fecth "dossier" and return if exists

        appendToLog("[info] Récupération détail dossier No: "+numDos);

        const sqlDetailDossier = `SELECT  NUMDOS, CATDOS,  ETAT, NOMPAT, DATEEH, DATESH, PREPAT, DDN, SEXE, TAUXSEJ, TAUXHON  FROM ${process.env.DB_USER}.ghdossier WHERE NUMDOS = :numdos AND (ETAT = :etat1 OR ETAT = :etat2)`;
        
        const sqlActes = `SELECT CODMED, DATEFR, QTEFR, TAUXBPC, PU, NOMTARIF, TT_PAT FROM ${process.env.DB_USER}.ghfrais WHERE NUMDOS = :numdos`;

        const sqlRglt = `SELECT SUM(MNTREG) AS MNTTOTALREG FROM ${process.env.DB_USER}.ghrgltdet WHERE NUMDOS = :numdos  GROUP BY NUMDOS`;
        
        //fetching "Dossier" detail
        const resultDossier = await connection.execute(sqlDetailDossier,
            {numdos: numDos, etat2: "E", etat1: "A"},
            { outFormat: oracledb.OUT_FORMAT_OBJECT}  // object format
        );
        
        //fecthing all acts of this "Dossier"
        const result = await connection.execute(sqlActes, 
            {numdos: numDos },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // fecthing all payment concluded for this "Dossier"
        const resultRglt = await connection.execute(sqlRglt,
            {numdos: numDos},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        //If we don't find any "dossier" from database
        if( resultDossier.rows && resultDossier.rows.length === 0){
            return null;        
        }

        const dos = resultDossier.rows[0];
        //
        const canEditAmount = (dos.CATDOS == "3" || dos.CATDOS == "4") ? 0 : 1;

        //for total amount paid by patient
        let totalAmountPaid = 0;
        let  data = {...dos, canEditAmount, actes: (result.rows && result.rows.length > 0)? result.rows : [] };

        //if(result.rows && canEditAmount === 0){
        const amount = result.rows.reduce( (prev, acte) =>  prev + acte.TT_PAT, 0.0);

        totalAmountPaid = (resultRglt.rows &&  resultRglt.rows.length > 0) ? resultRglt.rows[0].MNTTOTALREG : 0;
        const amountToPay = amount - totalAmountPaid;

        data["amount"] = amount;
        data["totalAmountPaid"] = totalAmountPaid;
        data["amountToPay"] = amountToPay;

        return data;
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        appendToLog("[error] "+error.message);
        throw new Error("Erreur lors de récupération des détails du dossier");
    }finally {
        if(connection){
            try{
                await connection.close();
            }catch(error){
                if(process.env.CONTEXT_EXEC === 'development'){
                    console.log(error);
                }
                appendToLog("[info] "+error.message);
                throw new Error(error.message);
            }
        }
    }
}