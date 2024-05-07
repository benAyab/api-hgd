const oracledb = require('oracledb');
const authValidate = require('../validations/validation.auth');
const dbConfig = require('../config/database');

//Authentificate
exports.auth = async (req, res) =>{
    let connection;

    try {
        if(req.body.login || req.body.password){
            return res.status(400).json({eror: 'MISSING_PARAM', message: "Missing user code or password"})
        }

        const { error } = authValidate({login: req.body.login, password: req.body.password});

        if(error){
            return res.status(400).json({error: 'INVALID_PARAM', message: "Missing user code or password"})
        }
        //after validation, now open connection to database
        connection = await oracledb.getConnection(dbConfig);

        //TODO 
        // Write request to fecth data from db and  
        // Test pasword, set cookie session and

        await connection.close();
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: 'INTERNAL_ERROR', message: "Internal server error"})
    } finally {

        if(connection){
            try{
                await connection.close();
            }catch(error){
                console.log(error);
                return res.status(500).json({error: 'INTERNAL_ERROR', message: "Internal server error"})
            }
        }
    }
}