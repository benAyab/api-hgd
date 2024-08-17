var express = require('express');
const fs = require("node:fs");
const path = require("path");
const Utils = require("./helpers/utils");

const { encryptFile, decryptfile, signEncrypted, generateKeyPairs, verifyDataIntegrity } = require("./services/service.cryptoModule");

require('dotenv').config();

//create debug log dir if not exist
if(!fs.existsSync("./log")){
    fs.mkdirSync("./log");
}

//create logEvents dir if not exist
if(!fs.existsSync("./logEvents")){
    fs.mkdirSync("./logEvents");
}

//generateKeyPairs();
// create local track file to handle last infos about logEvents files
const pathToDescFileLog = path.join(path.resolve('helpers'), "logFileDesc.txt");
if(!fs.existsSync(pathToDescFileLog)){
    
    const fileName = Utils.getDateInDDMMYYYY().replaceAll("/", "-")+".txt";
    const contentToAppend = { fileName }

    fs.writeFileSync(pathToDescFileLog, JSON.stringify(contentToAppend), { encoding: 'utf8', flag: "w" });
}

(async() =>{ //19-06-2024_17_13_00.crypt
    const pathToFile = path.join(path.resolve('logEvents'), "10-06-2024.txt");

    let pathEnc = ""
    
    if(fs.existsSync(pathToFile)){
       pathEnc = await encryptFile(pathToFile);
       
    }

    if(fs.existsSync(pathEnc)){
        decryptfile(pathEnc);
    }
})()


const bodyParser = require('body-parser');
const router = require('./routes/routes');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("cors")());

app.use('/api', router);

app.use((req, res, next) => {
    res.status(404).json({error: 'BAD_METHOD_OR_NOT_FOUND', message: "NOT FOUND"});
});

app.listen(process.env.SERVER_PORT, () =>{
    console.log(" Server running on ", process.env.SERVER_PORT);   
});