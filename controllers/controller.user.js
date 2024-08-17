const oracledb = require('oracledb');

const { validateLogin } = require('../validations/validation.auth');
const jwtUtils = require("../helpers/helper.jsonwebtoken");
//const generateTokenFromCrypto = require('../helpers/helper.generateUniqueToken');
const appendToLog = require("../services/service.log");
//const appendEventsToLog = require("../services/service.logserverEvents");

const dbConfig = require('../config/database');

const { usersdb } = require("../config/inmemodb");

//Authentificate
exports.auth = async (req, res) =>{
    let connection;
    try {
        if(!req.body.login || !req.body.password){
            return res.status(400).json({error: 'BAD_REQUEST_OR_SYNTAX', message: "Login ou Mot de passe invalide"});
        }

        const login = req.body.login;
        const password = req.body.password;

        const validationResult = validateLogin({login: login, password: password });
        appendToLog("[info] Initialisation connexion par le code utilisateur: "+login+ "  IP_ADDRESS: "+req.ip);

        if(validationResult.error){
            return res.status(400).json({error: 'INVALID_PARAM', message: "Login ou Mot de passe invalide"})
        }

        // after validation, now open connection to database
        oracledb.initOracleClient();
        connection = await oracledb.getConnection(dbConfig);

        const sql = `SELECT  CODEUTI,  FIRSTNAME, LASTNAME,  PWD FROM ${process.env.DB_USER}.aduser WHERE CODEUTI = :coduti`;

        const result = await connection.execute(sql,
            { coduti: login },
            { outFormat: oracledb.OUT_FORMAT_OBJECT}  // object format
        );

        if(result.rows?.length === 0){
            appendToLog("[error] Echec de connexion. Raison: utilisateur introuvable");
            return res.status(404).json({error: 'USER_NOT_FOUND', message: "Utilisateur introuvable"})
        }

        if(result.rows[0].PWD !== password){
            appendToLog("[error] Echec de connexion. Raison: mot de passe incorrect");
            return res.status(401).json({error: 'INCORRECT_PWD', message: "Mot de passe incorrect"})
        }

        
        const jwtToken = jwtUtils.generateToken({ login });
        const refreshtoken = jwtUtils.generateRefreshToken({login, expire: (Date.now() + 3600_000 * 24) });

        //here we manage user session to ensure that only one oponned session per user
        //is user is connected previously or his session ended?
        const connectedUser = usersdb.findOne({login: login});
        if(connectedUser){
            if(connectedUser.isconnected){
                return res.status(409).json({error: 'CONFLICT_USER_SESSION', message: "Une session est déjà ouverte pour cet utilisateur, veuillez vous déconnecter avant de continuer"});
            }else{
                connectedUser.isconnected = true;
                usersdb.update(connectedUser);
            }
        }else{
            //if not, insert user session
            usersdb.insertOne({login: login, isconnected: true, token: jwtToken});
        }

        const data = {
            firstname: result.rows[0].FIRSTNAME,
            lastname:result.rows[0].LASTNAME,
            refreshtoken,
            token: jwtToken,
            expire: 3600,
            expire_date: new Date(Date.now() + 3600_000)
        }

        appendToLog("[info] Utilisateur connecté");
        return res.status(200).json({ data });
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        appendToLog("[error] "+error.message);
        return res.status(500).json({error: 'INTERNAL_ERROR', message: "Erreur interne"})
    } finally {
        if(connection){
            try{
                await connection.close();
            }catch(error){
                if(process.env.CONTEXT_EXEC === 'development'){
                    console.log(error);
                }
                appendToLog("[error] "+error.message);
                return res.status(500).json({error: 'INTERNAL_ERROR', message: "Erreur interne"})
            }
        }
    }
}

//@controller
// to get connected user infos
// retuns data: Json object with user infos if succes 
exports.getUserInfos = async (req, res) => {
    let connection;
    try {
        if(!req.login){
            return res.status(401).json({error: "ACCES_DENIED", message: "Echec d'authentification"});
        }
        oracledb.initOracleClient();
        connection = await oracledb.getConnection(dbConfig);

        const sql = `SELECT  CODEUTI,  FIRSTNAME, LASTNAME FROM ${process.env.DB_USER}.aduser WHERE CODEUTI = :coduti`;

        const result = await connection.execute(sql,
            {coduti: req.login},
            { outFormat: oracledb.OUT_FORMAT_OBJECT}  // object format
        );

        if(result.rows.length === 0){
            return res.status(404).json({error: 'USER_NOT_FOUND', message: "Utilisateur introuvable"});
        }

        const data = {
            firstname: result.rows[0].FIRSTNAME,
            lastname:result.rows[0].LASTNAME,
            codeuti: result.rows[0].CODEUTI
        }

        return res.status(200).json({ data });

    }catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        return res.status(500).json({error: 'INTERNAL_ERROR', message: "Erreur interne"})
    } finally {
        if(connection){
            try{
                await connection.close();
            }catch(error){
                if(process.env.CONTEXT_EXEC === 'development'){
                    console.log(error);
                }
                return res.status(500).json({error: 'INTERNAL_ERROR', message: "Erreur interne"})
            }
        }
    }
}

//@controller
// logout user when request for
exports.logoutUser = (req, res) =>{
    if(!req.login){
        return res.status(401).json({error: "ACCES_DENIED", message: "Echec d'authentification"});
    }

    appendToLog("[info] Déconnexion de l'utilisateur: "+req.login);
    
    //changing user status when logout
    usersdb.findAndRemove({login: req.login});
    appendToLog("[info] Utilisateur: "+req.login+" déconnecté");

    const data = {login: req.login, status: "not connected"}
    return res.status(200).json({ data });
}

exports.refreshToken = async (req, res) =>{
    try {
        appendToLog("[info] Génération d'un nouveau token");
        if(!req.login || !req.refreshToken){
            appendToLog("[error] echec, requete invalide");
            return res.status(400).json({error: 'BAD_REQUEST_OR_SYNTAX', message: "Requete invalide"});
        }

        const login = req.login;

        const jwtToken = jwtUtils.generateToken({ login });

        //here we manage user session to ensure that only one oponned session per user
        //is user is connected previously or his session ended?
        const connectedUser = usersdb.findOne({login: login});
        if(connectedUser){
            connectedUser.isconnected = true;
            connectedUser.token = jwtToken;
            usersdb.update(connectedUser);
        }else{
            //if not, insert user session
            usersdb.insertOne({login: login, isconnected: true, token: jwtToken});
        }

        const data = {
            token: jwtToken,
            expire: 3600,
            expire_date: new Date(Date.now() + 3600_000)
        }

        appendToLog("[info] Nouveau Token généré  pour utilisateur: ", login);
        return res.status(200).json({ data });

    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        appendToLog("[error] "+error.message);
        return res.status(500).json({error: 'INTERNAL_ERROR', message: "Erreur interne"})
    }
}