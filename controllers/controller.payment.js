const adwapayService = require('../services/adwapay.service');
const generateTokenFromCrypto = require('../helpers/helper.generateUniqueToken');

exports.initPayment = async (req, res) => {
    try {
        const result = await adwapayService.getADToken();

        //const feesDetail = await adwapayService.getADFees({amount: 1000, accesToken: result.data.tokenCode})
        
        const orderNumber = generateTokenFromCrypto(10)

        const reqOpt = {
            "amount": 1000,
            "currency": "XAF",
            "meanCode": "ORANGE-MONEY",
            "paymentNumber": "698530658",
            "orderNumber": orderNumber,
            "feesAmount": 0
        }
        const requestToPayResult = await adwapayService.makePayment(reqOpt, result.data.tokenCode);

        

        return res.status(200).json({data: requestToPayResult.data });
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }

        return res.status(500).json({ error: 'PAYMENT_INIT_ERROR', message: "An error occured when trying to init payment with ADWAPAY API" });
    }
}