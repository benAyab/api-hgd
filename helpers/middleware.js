'use strict'
const jwtUtils = require("./helper.jsonwebtoken");

exports.isAuthenticated = async(req, res, next) =>{
  try {

    const authToken = req.get("Authorization");
    const token = req.session? req.session.token ? req.session.token : null : null;

    if (!authToken){
      return res.status(400).json({error: "INVALID_HEADERS", message: "Missing or invalid auth header"})
    }

    if (!token){
      return res.status(401).json({error: "ACCES_DENIED", message: "You must login"})
    }
    const decodedToken = jwtUtils.verifyAndDecodeToken(token);

    if(!decodedToken || decodedToken.token){
      return res.status(401).json({error: "ACCES_DENIED", message: "You must login"})
    }

    const headerToken = authToken.split(" ");
    console.log('Header token: ', headerToken);
    console.log("SESSION_TOKEN: ", decodedToken);
    next()
    
  }catch (error) {
    
  }
  
}