'use strict'

const oracledb = require('oracledb');
const dbConfig = require('../config/database');
const {getDetail2} = require("../services/service.getDetailDossier");

exports.findFolder = async (req, res) => {
    let connection;
    try {
        const numDos = req.params.numdossier;
        if(!numDos || isNaN(numDos) ){
            return res.status(400).json({error: 'INVALID_PARAM', message: "Numéro Dossier invalide"});
        }

        // after validation, now open connection to database
        oracledb.initOracleClient();
        connection = await oracledb.getConnection(dbConfig);
        
        //fecth dossier and return if exist
        const sql = `SELECT  NUMDOS,  ETAT FROM ${process.env.DB_USER}.ghdossier WHERE NUMDOS = :numdos AND ETAT = :etat`;

        const result = await connection.execute(sql,
            {numdos: numDos, etat: "E"},
            { outFormat: oracledb.OUT_FORMAT_OBJECT}  // object format
        );

        if(result.rows?.length === 0){
            return res.status(404).json({error: 'NOT_FOUND_ERROR', message: "Dossier introuvable"})
        }
        
        const data = {
            occurence: result.rows.length,
            numDos: (result.rows?.length === 0)? null : result.rows[0].NUMDOS,
            etat: (result.rows?.length === 0)? "": result.rows[0].ETAT
        }

        return res.status(200).json({ data });
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        return res.status(500).json({error: 'INTERNAL_ERROR', message: "Internal server error"})
    }finally {
        if(connection){
            try{
                await connection.close();
            }catch(error){
                if(process.env.CONTEXT_EXEC === 'development'){
                    console.log(error);
                }
                return res.status(500).json({error: 'INTERNAL_ERROR', message: "Internal server error"})
            }
        }
    }
}

//@controller
//get detail about giving Dossier (patient file)
// http @params: numDossier value for giving dossier
exports.getDetailDosier = async (req, res) =>{
    try {
        const numDos = req.params.numDossier;
        if(!numDos || isNaN(numDos)){
            return res.status(400).json({error: 'INVALID_PARAM', message: "Numéro Dossier"});
        }
        const data = await getDetail2(numDos);

        if(!data){
            return res.status(404).json({error: 'DOSSIER_INTROUVABLE', message: "Dossier introuvable"});
        }

        return res.status(200).json({ data });
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        return res.status(500).json({error: 'INTERNAL_ERROR', message: "Internal server error"});
    }
}