'use strict'
const JWT = require('jsonwebtoken');
const appendToLog = require("../services/service.log");

//generate token from user payload. Rteurns token if success || null if error
exports.generateToken =  (data) =>{
    try {
        if(!data){
            return null;
        }

        const token = JWT.sign(data, process.env.JWT_KEY, {expiresIn: "1h"})
        return token;
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        appendToLog("[error] "+error.message);
        return null;
    }
}

//We verify a giving token. Reurns decoded token or null if error;
exports.verifyAndDecodeToken = (token) =>{
    try {
        if(!token){
            return null;
        }
         return JWT.verify(token, process.env.JWT_KEY);
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        appendToLog("[error] "+error.message);
        return null;
    }
}

exports.generateRefreshToken = (data) =>{
    try {
        if(!data){
            return null;
        }

        const refreshToken = JWT.sign(data, process.env.JWT_KEY, {expiresIn: "1d"})
        return refreshToken;
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        appendToLog("[error] "+error.message);
        return null;
    }
}