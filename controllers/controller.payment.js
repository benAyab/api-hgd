'use strict'

const oracledb =                        require('oracledb');

const adwapayService =                  require('../services/adwapay.service');
const rgltRecord =                      require('../services/getLastRecord');
const checkAndGetLastTransaction =      require("../services/checkPreviousTransaction");

const generateTokenFromCrypto =         require('../helpers/helper.generateUniqueToken');
const { validateRequestToPayInput } =   require('../validations/validation.requestToPay');

const dbConfig =                        require('../config/database');
const appendToLog =                     require("../services/service.log"); 
const appendEventsToLog =               require("../services/service.logserverEvents");

// controller
//   validating and get ADWAPAY for getting acces token 
//  then init payment
// check status payment some time while status is "E"
// Input: an object req(@request) that handle incomming resquest
// Input: an object res(@response) response to client
// Output: Json object with data  
// thrown an error if request failled or other issue


exports.initPayment = async (req, res) => {
    //@var connection: objet session with database
    let connection;
    try {
        //validation des inputs 
        const validationResult = validateRequestToPayInput(req.body);

        if(validationResult.error){
            return res.status(400).json({error: 'INVALID_PARAM', message: "Paramètres invalides"});
        }

        //ensure that user is authentificated
        // req.login set by middleware @isAthentificated 
        if(!req.login){
            return res.status(401).json({error: "ACCES_DENIED", message: "Echec d'authentification"});
        }

        let fileEventContent = `TIMESTAMP: ${new Date().toISOString()}\nTYPE: APPLICATION\nCALLER: ${req.login}\n`;
        fileEventContent += `ORIGIN: ${req.hostname}\nFULL_URL:${req.originalUrl}\nTARGET: ${req.path}\nHEADER: ${JSON.stringify(req.headers)}\nPARAMS: ${JSON.stringify(req.query)}\n`;
        fileEventContent += `DATA: ${JSON.stringify(req.body)}\n`

        //init database instant client and set sticky mode for connection
        oracledb.initOracleClient();
        connection = await oracledb.getConnection(dbConfig);

        //fecth dossier and return if exist before initiate payment
        const sql = `SELECT  NUMDOS, CATDOS,  ETAT, NOMPAT, PREPAT, DDN, SEXE, TAUXSEJ, TAUXHON  FROM ${process.env.DB_USER}.ghdossier WHERE NUMDOS = :numdos AND ETAT = :etat`;
        const detaiDosResult = await connection.execute(sql,
            {numdos: req.body.numDossier, etat: "E"},
            { outFormat: oracledb.OUT_FORMAT_OBJECT}
        );

        if(!detaiDosResult.rows || detaiDosResult.rows.length === 0){

            fileEventContent += `RESPONSE: ${JSON.stringify({error: 'ADWAPAY_ERROR', message: "Echec de récupération des détails sur le dossier"})}`;
            appendEventsToLog(fileEventContent);
            
            appendToLog("Echec de récupération des détails sur le dossier");

            return res.status(404).json({error: 'NOT_FOUND_DOSSIER', message: "Dossier introuvable ou déjà réglé"});
        }

        //here we check if there is any initialised previous transaction
        const lastInitiatedTransaction = await checkAndGetLastTransaction(req.body.numDossier);
        appendToLog("[info] Vérification de transaction précédente encours...");

        const result = await adwapayService.getADToken();

        if(lastInitiatedTransaction && Array.isArray(lastInitiatedTransaction) && lastInitiatedTransaction.length > 0){
            appendToLog("[info] Transaction précédente trouvée...");
            
            const checkStatusResult = await adwapayService.getStatus({meanCode: lastInitiatedTransaction[0].PAYMENT_MEAN, adpFootprint: lastInitiatedTransaction[0].FOOTPRINT}, result.data.tokenCode);
            
            if(!checkStatusResult.data || checkStatusResult.pesake.code !== "" || checkStatusResult.data.status === "C" || checkStatusResult.data.status === "X" || checkStatusResult.data.status === "O"){
                
                fileEventContent += `RESPONSE: ${JSON.stringify({error: 'PAYMENT_FAILED', message: "Transaction précédent échouée"})}`;
                appendEventsToLog(fileEventContent);

                appendToLog(`[error] Echec de payement. Raison:  ${checkStatusResult.pesake.code !== "" ? checkStatusResult.pesake.code +" " +checkStatusResult.pesake.detail : "Status: "+checkStatusResult.data.status}`);
                
                //if transaction failed for any reason set set updte sattus to E = "Echec" in french [failed]
                const updateRGLTDigital = `UPDATE ${process.env.DB_USER}.GHRGLTDETDIGI SET STATE = :etat WHERE NUMRGLT = :numRglt`;
                connection = await oracledb.getConnection(dbConfig);

                //update last pending payment state to "E = echec"
                await connection.execute(updateRGLTDigital,
                    { etat: "E", numRglt:  lastInitiatedTransaction[0].NUMRGLT},
                    { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true}
                );

                return res.status(400).json({error: 'PAYMENT_FAILED', message: "Un payement précédent pour ce dossier a échoué, veuillez recommencer le payement"});

            } else if(checkStatusResult.data.status === "T"){

                const nompat = `${detaiDosResult.rows[0].NOMPAT? detaiDosResult.rows[0].NOMPAT : ""} ${detaiDosResult.rows[0].PREPAT? detaiDosResult.rows[0].PREPAT : ""}`;
                const type = `${(detaiDosResult.rows[0].TAUXSEJ > 0 || detaiDosResult.rows[0].TAUXHON > 0)? "RC" : "AV"}`
                //when transaction succeed
                // insert transaction in database and then return
                const inserRGLT = `INSERT INTO ${process.env.DB_USER}.ghrgltdet(CDOS, NUMDOS, NUMRGLT, DATERGLT, MNTREG, TYPERGLT, ETAT, LIBRGLT, TYPE, QTP, DATECREA, CODUTI, IMP, NBRE) VALUES(:cdos, :numdos, :numrglt, :daterglt, :mntreg, :typerglt, :etat, :librglt, :type, :qtp, :datcrea, :coduti, :imp, :nbre)`;
        
                //OK
                const detDetail = {
                    amount: lastInitiatedTransaction[0].MNTREG,
                    numDossier: req.body.numDossier,
                    payerNumber: lastInitiatedTransaction[0].PAYER_NUMBER,
                    numrglt: lastInitiatedTransaction[0].NUMRGLT,
                    dateDuJr: new Date() //`${Utils.getDateInDDMMYYYY()}`
                }

                connection = await oracledb.getConnection(dbConfig);
                
                await connection.execute(inserRGLT,
                    {   
                        cdos: '01',
                        numdos: detDetail.numDossier,
                        numrglt: detDetail.numrglt,
                        daterglt: detDetail.dateDuJr,
                        mntreg: detDetail.amount,
                        typerglt: "DIG",
                        etat: "E",
                        librglt: nompat,
                        type: type,
                        qtp: null,
                        datcrea: detDetail.dateDuJr,
                        coduti: `${req.login}`,
                        imp: `${type ==="AV"? "N":""}`,
                        nbre: `${type === "AV"? 0:""}`
                    },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true}  // object format
                );

                //OK
                if(detaiDosResult.rows[0].CATDOS == "3" || detaiDosResult.rows[0].CATDOS == "4"){
                    const updateDossierSQL = `UPDATE ${process.env.DB_USER}.ghdossier SET ETAT = :etat WHERE NUMDOS = :numdos`;

                    await connection.execute(updateDossierSQL,
                        { etat: "A", numdos: detDetail.numDossier },
                        { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true}
                    )
                }

                //if transaction is validated by client set status to S "Succes"
                const updateRGLTDigital = `UPDATE ${process.env.DB_USER}.GHRGLTDETDIGI SET STATE = :etat WHERE NUMRGLT = :numRglt`;
                await connection.execute(updateRGLTDigital,
                    { etat: "S", numRglt:  detDetail.numrglt},
                    { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true}
                )

                const data = {
                    numDossier: req.body.numDossier,
                    numRGLT: detDetail.numrglt,
                    status: "SUCCES",
                    paymentNumber: detDetail.payerNumber,
                    amount: detDetail.amount,
                    adpFootprint: checkStatusResult.data.adpFootprint
                }
                appendToLog("[info] Transaction précédente confirmée");

                //loging events
                fileEventContent += `RESPONSE: ${JSON.stringify({ data })}`;
                appendEventsToLog(fileEventContent);

                return res.status(200).json({ data });
            }else{
                return res.status(400).json({error: 'PENDING_PAYMENT', message: "Une Transaction précédente pour ce dossier est en cours, veuillez attendre quelques instants et recommencer le paiement"}); 
            }
        }

        appendToLog("[info] Initialisation de payement...");
        const orderNumber = generateTokenFromCrypto(10);

        const reqOpt = {
            "amount": req.body.amount,
            "currency": req.body.currency,
            "meanCode": req.body.meanCode,
            "paymentNumber": req.body.paymentNumber,
            "orderNumber": orderNumber,
            "feesAmount": 0
        }


        const requestToPayResult = await adwapayService.makePayment(reqOpt, result.data.tokenCode);

        //get last insert 
        let numRGT = 1
        const lastNumR = await rgltRecord();
        if(lastNumR.rows || lastNumR.rows.length > 0){
            numRGT  = (lastNumR.rows[0].NUMRGLT * 1) + 1;
        }

        //when we initiate a transaction, with insert in data to GHRGLTDETDIGI when STATE = I "In progress"
        const inserRGLTDIGITrx = `INSERT INTO ${process.env.DB_USER}.GHRGLTDETDIGI(CDOS, NUMDOS, NUMRGLT, MNTREG, PAYMENT_MEAN, FOOTPRINT, ORDER_NUMBER, NUMBER_PRINTS, STATE, PAYER_NUMBER, AUTHOR_CODE) VALUES(:cdos, :numdos, :numrglt, :mntreg, :payment_mean, :footprint, :ordernumber, :nbre, :state, :payerNo, :author)`;
        

        if(!requestToPayResult.data.data || requestToPayResult.data.pesake.code !== ""){
            
            fileEventContent += `RESPONSE: ${JSON.stringify({error: 'ADWAPAY_ERROR', message: requestToPayResult.data?.pesake?.detail})}`;
            appendEventsToLog(fileEventContent);
            
            appendToLog("[error] Echec d'initialisation. Raison: "+requestToPayResult.data?.pesake?.detail);

            return res.status(404).json({error: 'ADWAPAY_ERROR', message: requestToPayResult.data?.pesake?.detail});
        }

        if(requestToPayResult.data.data.status && requestToPayResult.data.data.status == "O" && requestToPayResult.data.data.description){
            fileEventContent += `RESPONSE: ${JSON.stringify({error: 'ADWAPAY_ERROR', message: "Le Numéro du payeur n'a pas de compte"})}`;
            appendEventsToLog(fileEventContent);
            
            appendToLog("[error] Echec d'initialisation. Raison: Numéro du payeur n'a pas de compte");

            return res.status(404).json({error: 'ADWAPAY_ERROR', message: "Le Numéro du payeur n'a pas de compte"});
        }

        //TODO check first if

        await connection.execute(inserRGLTDIGITrx,
            {   
                cdos: '01',
                numdos: req.body.numDossier,
                numrglt: numRGT,
                mntreg: reqOpt.amount,
                payment_mean: `${reqOpt.meanCode}`,
                footprint: `${requestToPayResult.data.data.adpFootprint}`,
                ordernumber: `${requestToPayResult.data.data.orderNumber}`,
                nbre: 0,
                state: 'I',
                payerNo: `${reqOpt.paymentNumber}`,
                author: `${req.login}`
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true}  // object format
        );

        //log event to debug log file
        appendToLog("[info] Payement initié");

        //function statusCheck
        // called every 3.5s when transaction is initiated
        // when transaction succeed or failed, 
        const statusCheck = async function(){
        
            const checkStatusResult = await adwapayService.getStatus({meanCode: req.body.meanCode, adpFootprint: requestToPayResult.data.data.adpFootprint}, result.data.tokenCode);
           
            if(!checkStatusResult.data || checkStatusResult.pesake.code !== "" || checkStatusResult.data.status === "C" || checkStatusResult.data.status === "X" || checkStatusResult.data.status === "O"){
                
                fileEventContent += `RESPONSE: ${JSON.stringify({error: 'PAYMENT_FAILED', message: "Echec de payement"})}`;
                appendEventsToLog(fileEventContent);

                appendToLog(`[error] Echec de payement. Raison:  ${checkStatusResult.pesake.code !== "" ? checkStatusResult.pesake.code +" " +checkStatusResult.pesake.detail : "Status: "+checkStatusResult.data.status}`);
                
                //if transaction failed for any reason set set updte sattus to E = "Echec" in french [failed]
                const updateRGLTDigital = `UPDATE ${process.env.DB_USER}.GHRGLTDETDIGI SET STATE = :etat WHERE NUMRGLT = :numRglt`;
                connection = await oracledb.getConnection(dbConfig);

                await connection.execute(updateRGLTDigital,
                    { etat: "E", numRglt:  numRGT},
                    { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true}
                );

                return res.status(400).json({error: 'PAYMENT_FAILED', message: "Echec de payement"});

            } else if(checkStatusResult.data.status === "T"){
                //when transaction succeed
                // insert transaction in database and then return
                const inserRGLT = `INSERT INTO ${process.env.DB_USER}.ghrgltdet(CDOS, NUMDOS, NUMRGLT, DATERGLT, MNTREG, TYPERGLT, ETAT, LIBRGLT, TYPE, QTP, DATECREA, CODUTI, IMP, NBRE) VALUES(:cdos, :numdos, :numrglt, :daterglt, :mntreg, :typerglt, :etat, :librglt, :type, :qtp, :datcrea, :coduti, :imp, :nbre)`;

                const nompat = `${detaiDosResult.rows[0].NOMPAT? detaiDosResult.rows[0].NOMPAT : ""} ${detaiDosResult.rows[0].PREPAT? detaiDosResult.rows[0].PREPAT : ""}`;
                const type = `${(detaiDosResult.rows[0].TAUXSEJ > 0 || detaiDosResult.rows[0].TAUXHON > 0)? "RC" : "AV"}`
        
                const detDetail = {
                    amount: req.body.amount,
                    numDossier: req.body.numDossier,
                    dateDuJr: new Date() //`${Utils.getDateInDDMMYYYY()}`
                }

                connection = await oracledb.getConnection(dbConfig);
                
                await connection.execute(inserRGLT,
                    {   
                        cdos: '01',
                        numdos: detDetail.numDossier,
                        numrglt: numRGT,
                        daterglt: detDetail.dateDuJr,
                        mntreg: detDetail.amount,
                        typerglt: "DIG",
                        etat: "E",
                        librglt: nompat,
                        type: type,
                        qtp: null,
                        datcrea: detDetail.dateDuJr,
                        coduti: `${req.login}`,
                        imp: `${type ==="AV"? "N":""}`,
                        nbre: `${type === "AV"? 0:""}`
                    },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true}  // object format
                );

                if(detaiDosResult.rows[0].CATDOS == "3" || detaiDosResult.rows[0].CATDOS == "4"){
                    const updateDossierSQL = `UPDATE ${process.env.DB_USER}.ghdossier SET ETAT = :etat WHERE NUMDOS = :numdos`;

                    await connection.execute(updateDossierSQL,
                        { etat: "A", numdos: detDetail.numDossier },
                        { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true}
                    )
                }

                //if transaction is validated by client set status to S "Succes"
                const updateRGLTDigital = `UPDATE ${process.env.DB_USER}.GHRGLTDETDIGI SET STATE = :etat WHERE NUMRGLT = :numRglt`;
                await connection.execute(updateRGLTDigital,
                    { etat: "S", numRglt:  numRGT},
                    { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true}
                )

                if(connection){
                    await connection.close();
                }

                const data = {
                    numDossier: req.body.numDossier,
                    numRGLT: numRGT,
                    status: "SUCCES",
                    paymentNumber: req.body.paymentNumber,
                    amount: req.body.amount,
                    adpFootprint: checkStatusResult.data.adpFootprint
                }
                appendToLog("[info] Payement confirmé");

                //loging events
                fileEventContent += `RESPONSE: ${JSON.stringify({ data })}`;
                appendEventsToLog(fileEventContent);

                return res.status(200).json({ data });
            }else{
                if(checkStatusResult.data.status == "E"){
                    setTimeout(async() =>{
                        await statusCheck();
                    }, 3500);
                }
            }
        }

       setTimeout( async() => {
            await statusCheck();
        }, 3500);

    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        appendToLog("[error] "+error.message);
        return res.status(500).json({ error: 'PAYMENT_INIT_ERROR', message: "An error occured when trying to init payment" });
    }finally {
        if(connection){
            try{
                await connection.close();
            }catch(error){
                if(process.env.CONTEXT_EXEC === 'development'){
                    console.log(error);
                }
                appendToLog("[error] "+error.message);
                return res.status(500).json({error: 'INTERNAL_ERROR', message: "Internal server error"})
            }
        }
    }
}

//@controller to check status of giving transaction
//Input: 
exports.checkStatus = async (req, res) => {
    try {
        if(!req.body || !req.body.adpFootprint || !req.body.meanCode){
            return res.status(400).json({error: 'BAD_REQUEST_OR_SYNTAX', message: "paramètres invalides"});
        }

        const ckeckResult = await adwapayService.getStatus(req.body);

        return ckeckResult;

    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        return res.status(500).json({ error: 'CKECK_STATUS_ERROR', message: "An error occured when ckecking status" });
    }
}

//@controller
// for  getting supported MEAN PAYMENT by ADWAPAY
//@return data Json with array of mean payments if succes
exports.getMeanPayment = async(req, res) =>{
    try {
        //First get acces token
        const result = await adwapayService.getADToken();
        const getFeesRequest = await adwapayService.getADFees({accesToken: result.data.tokenCode});

        //if error
        if(getFeesRequest?.pesake?.code !== ""){
            return res.status(500).json({error: "ADWAPAY_ERROR", message: getFeesRequest?.pesake?.detail || "Erreur lors de récupérations des moyens de payement"})
        }

        //else structure and get data 
        const meanCodes = (getFeesRequest.data?.length > 0)? getFeesRequest.data : [];

        const data = meanCodes.map(m => m.meanCode);

        return res.status(200).json({data});
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        appendToLog("[error] "+error.message);
        return res.status(500).json({ error: 'GET_MEAN_PAYMENT_ERROR', message: "Erreur lors de récupération des moyens de payement" });
    }
}
