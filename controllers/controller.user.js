const oracledb = require('oracledb');

const { validateLogin } = require('../validations/validation.auth');
const jwtUtils = require("../helpers/helper.jsonwebtoken");
//const generateTokenFromCrypto = require('../helpers/helper.generateUniqueToken');

const dbConfig = require('../config/database');

//Authentificate
exports.auth = async (req, res) =>{
    let connection;

    try {
        if(!req.body.login || !req.body.password){
            return res.status(400).json({error: 'BAD_REQUEST_OR_SYNTAX', message: "Missing login or password key in request"});
        }

        const login = req.body.login;
        const password = req.body.password;

        const validationResult = validateLogin({login: login, password: password });

        if(validationResult.error){
            return res.status(400).json({error: 'INVALID_PARAM', message: "Missing user code or password"})
        }
        // after validation, now open connection to database
        oracledb.initOracleClient();
        connection = await oracledb.getConnection(dbConfig);

        const sql = `SELECT login, password FROM adduser`;

        const result = await connection.execute(sql,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT}  // object format
        );
        
        console.log(result.rows);  // print all returned rows
        
        const jwtToken = jwtUtils.generateToken({ login });

        const data = {
            token: jwtToken,
            expire: 3600,
            expire_date: new Date(Date.now() + 3600_000)
        }
        await connection.close();

        return res.status(200).json({ data });

        // TODO 
        // Write request to fecth data from db
        // Test pasword, set cookie session

    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        return res.status(500).json({error: 'INTERNAL_ERROR', message: "Internal server error"})
    } finally {
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