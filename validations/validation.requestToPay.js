const Joi = require('joi');

exports.validateRequestToPayInput = (data = {}) => {

    const schema = Joi.object({
        amount: Joi.number()
        .min(0.0)
        .required(),

        currency: Joi.string()
        .min(2)
        .max(10)
        .required(),

        meanCode: Joi.string()
        .min(5)
        .max(15)
        .required(),

        paymentNumber: Joi.string()
        .min(9)
        .max(9)
        .required(),

        numDossier: Joi.number()
        .integer()
        .min(0)
        .required()
    });

    const validationResult = schema.validate(data);

    return validationResult;
}