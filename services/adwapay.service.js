'use strict';

const axios = require('axios');
const { validateRequestToPayInput } = require('../validations/validation.requestToPay')

exports.getADToken = async () =>{
    try {
        const ADWAPAY_URL = process.env.ADWAPAY_BASE_URL;

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
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(response.data);
        }

        return response.data;
        
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error.message);
        }
        throw new Error(error.message);
    }
}

//make API CALL to get fees
exports.getADFees = async (data = {}) =>{
    try {
        //Before make api call to get fees
        if(!data || !data.amount || !data.accesToken){
            throw new Error("Invalid data params for get-fees api call")
        }

        const ADWAPAY_URL = process.env.ADWAPAY_BASE_URL;

        const response = await axios.post(`${ADWAPAY_URL}/getFees`, 
            {
                "amount": data.amount,
                "currency": "XAF"
            },
            {
                headers: {
                    "AUTH-API-SUBSCRIPTION": process.env.ADWAPAY_SUBSCRIPTION,
                    "AUTH-API-TOKEN": `Bearer ${data.accesToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(response.data);
        }

        return response.data;

    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        throw new Error(error.message)
    }
}


exports.makePayment = async (infos = {}, accesToken = "") =>{
    try {
        const validationResult = validateRequestToPayInput(infos)

        if(validationResult.error){
            throw new Error("Invalid params for request_to_pay api call")
        }

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
        throw new Error(error.message);
    }
}