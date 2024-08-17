'use strict';

const axios = require('axios');
const appendToLog = require("../services/service.log");

// function (getADToken) for getting acces token from adwapay api
// Input: an object with key 'pattern'
// Output: If succes an object response from ADWAPAY API 
//        else thrown an error 

exports.getADToken = async () =>{
    try {
        const ADWAPAY_URL = process.env.ADWAPAY_BASE_URL;

        //user and password to convert to 
        const userAndPwd = process.env.ADWAPAY_MARCHANT + ":" + process.env.ADWAPAY_SUBSCRIPTION; 
        const buff =  Buffer.from(userAndPwd);

        const base64data = buff.toString('base64');
        const authHeaderValue = `Basic ${base64data}`;

        const response = await axios({
            method: 'post',
            url: `${ADWAPAY_URL}/getADPToken`,
            data: {
                application: process.env.ADWAPAY_APPLICATION_ID
            },
            headers: {
                "Authorization": authHeaderValue,
                "Content-Type": "application/json"
            },
        });
       
        return response.data;
        
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error.message);
        }
        appendToLog("[error] "+error.message);
        throw new Error(error.message);
    }
}

//make API CALL to get fees
// Input: an object with key 'accesToken'
// Output: an oject with "data" containing detail about request if succes
//          else thrown an error objet with with message set to returned error message
exports.getADFees = async (data = {}) =>{
    try {
        //Before make api call to get fees
        if(!data || !data.accesToken){
            throw new Error("Invalid data params for get-fees api call")
        }

        const ADWAPAY_URL = process.env.ADWAPAY_BASE_URL;

        const response = await axios.post(`${ADWAPAY_URL}/getFees`, 
            {
                "amount": process.env.ADWAPAY_GET_FEES_AMOUNT,
                "currency": ADWAPAY_CURRENCY.ADWAPAY_CURRENCY
            },
            {
                headers: {
                    "AUTH-API-SUBSCRIPTION": process.env.ADWAPAY_SUBSCRIPTION,
                    "AUTH-API-TOKEN": `Bearer ${data.accesToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;

    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        throw new Error(error.message);
    }
}

//Fuction: makePayement
// service to initiate request to pay with ADWAPAY API
// Input: infos an object with keys amount: Number (value to pay), currency: String (amount currency)
//          meanCode: String (mean payment), orderNumber: String (unique order identifier), feesAmount: Number (transaction fees)
//          accesToken: String (session access token for giving user)
// Output: response: object (response returned by awapay api)
exports.makePayment = async (infos = {}, accesToken = "") =>{
    try {

        const ADWAPAY_URL = process.env.ADWAPAY_BASE_URL;
        const response = await axios.post(`${ADWAPAY_URL}/requestToPay`, 
            {
                amount: infos.amount,
                currency: infos.currency,
                meanCode: infos.meanCode,
                paymentNumber: infos.paymentNumber,
                orderNumber: infos.orderNumber,
                feesAmount: infos.feesAmount
            },
            {
                headers: {
                    "AUTH-API-SUBSCRIPTION": process.env.ADWAPAY_SUBSCRIPTION,
                    "AUTH-API-TOKEN": `Bearer ${accesToken}`,
                    "Content-Type": "application/json"
                }
            }
        );
        
        return response;
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        appendToLog("[error] "+error.message);
        throw new Error(error.message);
    }
}

// Fuction: getStatus
// service to get status of one transaction
// Input: data an object with keys. adpFootprint: String
//          meanCode: String (mean payment), 
// Output: response: object (response returned by awapay api)
exports.getStatus = async (data = {}, accesToken) => {
    try {
        if(!data || !data.meanCode || !data.adpFootprint){
            throw new Error("Invalid data params for get-status")
        }
    
        const ADWAPAY_URL = process.env.ADWAPAY_BASE_URL;
    
        const response = await axios.post(`${ADWAPAY_URL}/paymentStatus`, 
            {
                adpFootprint: data.adpFootprint,
                meanCode: data.meanCode
            },
            {
                headers: {
                    "AUTH-API-SUBSCRIPTION": process.env.ADWAPAY_SUBSCRIPTION,
                    "AUTH-API-TOKEN": `Bearer ${accesToken}`,
                    "Content-Type": "application/json"
                }
            }
        ); 
        return response.data;
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        appendToLog("[error] "+error.message);
        throw new Error(error.message);
    }
}