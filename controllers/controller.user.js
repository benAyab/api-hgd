const oracledb = require('oracledb');

const { validateLogin } = require('../validations/validation.auth');
const jwtUtils = require("../helpers/helper.jsonwebtoken");
const generateTokenFromCrypto = require('../helpers/helper.generateUniqueToken');

const dbConfig = require('../config/database');

//Authentificate
exports.auth = async (req, res) =>{
    let connection;

    try {
        
        if(!req.body.login || !req.body.password){
            return res.status(400).json({error: 'BAD_REQUEST_OR_SYNTAX', message: "Missing login or password key in request"})
        }

        const validationResult = validateLogin({login: req.body.login, password: req.body.password});

        if(validationResult.error){
            return res.status(400).json({error: 'INVALID_PARAM', message: "Missing user code or password"})
        }
        // after validation, now open connection to database
        // connection = await oracledb.getConnection(dbConfig);
         
        const login = "023US"

        const token = generateTokenFromCrypto();
        const jwtToken = jwtUtils.generateToken({login: login, token: token});

        req.session.token = jwtToken;

        const data = {
            token: token,
            expire: 3600,
            expire_date: new Date(Date.now() + 3600_000)
        }

        return res.status(200).json({ data });

        // TODO 
        // Write request to fecth data from db
        // Test pasword, set cookie session
        // await connection.close();

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