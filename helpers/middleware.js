'use strict'
const jwtUtils = require("./helper.jsonwebtoken");

exports.isAuthenticated = async(req, res, next) =>{
  try {
    const rawauthToken = req.get("Authorization");

    if (!rawauthToken){
      return res.status(400).json({error: "INVALID_HEADERS", message: "Missing or invalid auth header"})
    }

    const authToken = rawauthToken.split(" ")[1];

    const decodedToken = jwtUtils.verifyAndDecodeToken(authToken);

    if(!decodedToken || !decodedToken.login){
      return res.status(401).json({error: "ACCES_DENIED", message: "Request authentification failed"});
    }
    
    next()
    
  }catch (error) {
    if(process.env.CONTEXT_EXEC === 'development'){
      console.log(error.message);
    }
    return res.status(500).json({error: 'INTERNAL_ERROR', message: "Internal server error"})
  }
  
}