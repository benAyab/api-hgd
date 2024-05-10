'use strict'
const JWT = require('jsonwebtoken');

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
        return null;
    }
}