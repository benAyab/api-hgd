const fs            = require("node:fs");
const path          = require("path");

require('dotenv').config();

const { encryptFile, decryptfile, signEncrypted, generateKeyPairs, verifyDataIntegrity } = require("./services/service.cryptoModule");



(async () =>{
    const pathToDescFileLog = path.join(path.resolve('log'), "10-06-2024.log");
    const pathToPrivateKey = path.join(path.resolve('keys'), "privateKey.pem");
    const pathToPublicKey = path.join(path.resolve('keys'), "publicKey.pem");

    if(fs.existsSync(pathToDescFileLog)){

        try {
            //const pathToEncryptedFile = await encryptFile(pathToDescFileLog);
            const pathToEncryptedFile = path.join(path.resolve('logEvents'), "17-07-2024_15_30_29.crypt");

            console.log("Path to encrypted file: ", pathToEncryptedFile);

            console.log("Signing file... "); //
            const pathToSignature  = path.join(path.resolve('logEvents'), "17-07-2024_15_30_29.crypt.sign");

            //const pathToSignature = await signEncrypted(pathToEncryptedFile, pathToPrivateKey);

            await signEncrypted(pathToEncryptedFile, pathToPrivateKey);

            console.log("File Signed, path to signature: ", pathToSignature);

            console.log("Verifying signature...");
            const statusSign = await verifyDataIntegrity (pathToEncryptedFile,  pathToSignature, pathToPublicKey);

            //console.log("STATUS " ,statusSign);

            const msg = statusSign === true? "The file is original" : "The file has been modified";

            console.log("After verification, we can say that ", msg);

            const startDate = new Date((new Date()).setHours(1, 0, 0))
            const endDate = new Date( startDate.getTime() + (23 * 3600 * 1000) + (59*60*1000) + 59000);

            console.log("startDate: ", startDate.toISOString());
            console.log("endDate: ", endDate.toISOString());

            //console.log(decryptfile(pathToEncryptedFile))
        } catch (error) {
            console.log(error)
        }
    }else{
        console.log("Invalid path");
    }

})()