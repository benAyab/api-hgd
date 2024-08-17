'use strict'

const oracledb = require('oracledb');
const dbConfig = require('../config/database');

const checkAndGetLastTransaction = async (numdos) =>{
    let connection;
    try {
        oracledb.initOracleClient();
        connection = await oracledb.getConnection(dbConfig);
        const checkPreviousTrxSql = `SELECT NUMDOS, NUMRGLT, MNTREG, PAYMENT_MEAN, FOOTPRINT, ORDER_NUMBER, NUMBER_PRINTS, STATE, PAYER_NUMBER, AUTHOR_CODE FROM ${process.env.DB_USER}.GHRGLTDETDIGI WHERE NUMDOS = :numDos AND STATE = :etat`;

        const result = await connection.execute(checkPreviousTrxSql, {numDos: numdos, etat: "I"}, { outFormat: oracledb.OUT_FORMAT_OBJECT});

        return result.rows? result.rows: null;
    } catch (error) {
        console.log(error);
        throw new Error("Erreur lors de récupération du dernier NUMRGLT");
    }finally {
        if(connection){
            try{
                await connection.close();
            }catch(error){
                throw new Error(error.message);
            }
        }
    }
}

module.exports = checkAndGetLastTransaction;