const Joi = require('joi');

exports.validateLogin = (login) => {

    const schema = Joi.object({
        login: Joi.string()
        .min(4)
        .max(6)
        .required(),

        password: Joi.string()
        .alphanum()
        .min(8)
        .max(10)
        .required(),
    });

    const longinValid = schema.validate(login);

    return longinValid;
}