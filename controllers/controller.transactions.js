'use strict'

const oracledb = require('oracledb');
const dbConfig = require('../config/database');

//@controller 
//fetch all transactions made by user
//Input: an object req(@request) that handle incomming resquest
//Input: an object res(@response) response to client with an Json object
//Output: a Json object data
//thrown an error if failed
exports.getAlldigitalTransactions = async (req, res) =>{
    let connection;
    try {
        oracledb.initOracleClient();
        connection = await oracledb.getConnection(dbConfig);
        
        const sql = `SELECT * FROM ${process.env.DB_USER}.GHRGLTDETDIGI WHERE AUTHOR_CODE = :coduti AND STATE = :etat ORDER BY CREATED_AT ASC`;

        const result = await connection.execute(sql,
            {coduti: `${req.login}`, etat: "S"},
            { outFormat: oracledb.OUT_FORMAT_OBJECT}  // object format
        );

        //we get any transaction ?
        //if not 
        if(result.rows?.length === 0){
            return res.status(404).json({error: 'NOT_FOUND_ERROR', message: "Aucune transaction digitale trouvée"})
        }
        const data = result.rows

        return res.status(200).json({ data });
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        return res.status(500).json({error: 'INTERNAL_ERROR', message: "Internal server error"});
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

exports.getAllTransactionsOfDate = async (req, res) =>{
    let connection;
    try {
        if(! req.body.date){
            return res.status(400).json({error: 'INVALID_PARAM', message:"les paramètres sont invalides"})
        }
        oracledb.initOracleClient();
        connection = await oracledb.getConnection(dbConfig);
        
        const sql = `SELECT * FROM ${process.env.DB_USER}.GHRGLTDETDIGI WHERE AUTHOR_CODE = :coduti AND STATE = :etat ORDER BY CREATED_AT ASC`;

        const result = await connection.execute(sql,
            {coduti: `${req.login}`, etat: "S"},
            { outFormat: oracledb.OUT_FORMAT_OBJECT}  // object format
        );

        //we get any transaction ?
        if(result.rows?.length === 0){
            return res.status(404).json({error: 'NOT_FOUND_ERROR', message: "Aucune transaction digitale trouvée"})
        }
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
