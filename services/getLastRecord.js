'use strict'

const oracledb = require('oracledb');
const dbConfig = require('../config/database');

const getLastRecordOfRGLT = async () =>{
    let connection;
    try {
        oracledb.initOracleClient();
        connection = await oracledb.getConnection(dbConfig);
        const sql = `SELECT * FROM (SELECT NUMRGLT FROM ${process.env.DB_USER}.ghrgltdet ORDER BY NUMRGLT DESC) WHERE ROWNUM <= 1`;

        const result = await connection.execute(sql, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT});
        return result; 
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

module.exports = getLastRecordOfRGLT;