'use strict'
const jwtUtils = require("./helper.jsonwebtoken");
const { usersdb } = require("../config/inmemodb");

exports.isAuthenticated = async(req, res, next) =>{
  try {
    const rawauthToken = req.get("Authorization");

    if (!rawauthToken){
      return res.status(400).json({error: "INVALID_HEADERS", message: "Authentificaion non valide"});
    }

    const authToken = rawauthToken.split(" ")[1];

    const decodedToken = jwtUtils.verifyAndDecodeToken(authToken);

    if(!decodedToken || !decodedToken.login){
      //Si un token est expiré, on supprime la session de l'utilisateur
      usersdb.findAndRemove({token: authToken});
      return res.status(401).json({error: "ACCES_DENIED", message: "Echec authentification"});
    }

    req.login = `${decodedToken.login}`
    next()
    
  }catch (error) {
    if(process.env.CONTEXT_EXEC === 'development'){
      console.log(error.message);
    }
    return res.status(500).json({error: 'INTERNAL_ERROR', message: "Erreur interne survenue"})
  } 
}

//middleware to handle incomming request when refresh is requested 
exports.checkRefreshTken = async (req, res, next) =>{
  try {
    //check first is refresh token is sent in body

    //if not sent, return with 401 http error
    if(req.body?.refreshtoken){
      const refreshToken = jwtUtils.verifyAndDecodeToken(req.body.refreshtoken);
      if(!refreshToken || refreshToken.login){
        return res.status(401).json({error: "ACCES_DENIED", message: "Echec authentification"});
      }

      req.refreshToken = JSON.stringify(refreshToken);
      next();

    }else{
      return res.status(400).json({error: 'INVALID_PARAM', message: "Requete invalide"});
    }
  } catch (error) {
    if(process.env.CONTEXT_EXEC === 'development'){
      console.log(error.message);
    }
    return res.status(500).json({error: 'INTERNAL_ERROR', message: "Erreur interne survenue"})
  }
}