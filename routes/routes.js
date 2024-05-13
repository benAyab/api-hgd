const Router = require('express').Router();
const userController = require('../controllers/controller.user');
const paymentController = require('../controllers/controller.payment');
const recusFactureController = require('../controllers/controller.RecusAndFacture');

const { isAuthenticated } = require('../helpers/middleware');

//User routes

Router.post('/v1/user/login', userController.auth);

Router.post('/v1/payment/init', isAuthenticated, paymentController.initPayment);

Router.post('/v1/dossier/printRecus/:numDossier',  recusFactureController.getFactureDetail);

module.exports = Router;