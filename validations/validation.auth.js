const Joi = require('joi');

exports.login = async (login) => {

    const schema = Joi.object({
        login: Joi.string()
        .alphanum()
        .min(8)
        .max(10)
        .required(),

        password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{8,10}$'))
        .required(),
    });

    const longinValid = schema.validate(login);

    return longinValid;
}