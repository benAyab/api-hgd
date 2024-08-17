const Router = require('express').Router();
const userController = require('../controllers/controller.user');
const paymentController = require('../controllers/controller.payment');
const recusFactureController = require('../controllers/controller.RecusAndFacture');
const dossierContrller = require('../controllers/controller.dossier');
const digitalTransaction = require("../controllers/controller.transactions");

const { isAuthenticated } = require('../helpers/middleware');

//User routes

Router.post('/v1/user/login', userController.auth);
Router.get("/v1/user/infos", isAuthenticated, userController.getUserInfos);
Router.get("/v1/user/logout", isAuthenticated, userController.logoutUser);

Router.post('/v1/payment/init', isAuthenticated, paymentController.initPayment);
Router.get('/v1/payment/getMeanPayment', isAuthenticated, paymentController.getMeanPayment);

Router.get("/v1/documents/recus/:numrecus", isAuthenticated, recusFactureController.generateAndDownloadRecus);
Router.get('/v1/documents/facture/:numdossier', isAuthenticated, recusFactureController.generateAndDownloadFacture); //isAuthenticated,

Router.post('/v1/dossier/find/:numdossier', isAuthenticated, dossierContrller.findFolder);
Router.post('/v1/dossier/getDetail/:numDossier', isAuthenticated, dossierContrller.getDetailDosier);
//Router.get("/v1/getAllDossier", isAuthenticated, dossierContrller.getallDossiers);

Router.get("/v1/transactions/getDigitalTransactions", isAuthenticated, digitalTransaction.getAlldigitalTransactions);

module.exports = Router;