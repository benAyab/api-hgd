const Router = require('express').Router();
const userController = require('../controllers/controller.user');
const paymentController = require('../controllers/controller.payment');
const { isAuthenticated } = require('../helpers/middleware');

//User routes

Router.post('/v1/user/login', userController.auth);

Router.post('/v1/payment/init', isAuthenticated, paymentController.initPayment)

module.exports = Router;