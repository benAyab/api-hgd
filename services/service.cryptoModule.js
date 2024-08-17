'use strict'

const crypto    =  require('node:crypto');
const path      = require("path");
const fs        = require("node:fs");
const Utils     = require("../helpers/utils");

// Function: generateKeyPair (private and public)
// generate a key pair used to encrypt an decipher events logs
// save generated key in 2 files with .pem extension
exports.generateKeyPairs = () =>{
    try {
        const keyPairOpts = {
            modulusLength: 1024,
            publicKeyEncoding: {
              type: 'spki',
              format: 'pem',
            },
            privateKeyEncoding: {
              type: 'pkcs8',
              format: 'pem',
            },
        }
    
        const keyPair = crypto.generateKeyPairSync("rsa", keyPairOpts);
    
        if( !fs.existsSync( path.join(path.resolve("keys"), "privateKey.pem"))){
            const pathToPrivateKey = path.join(path.resolve("keys"), "privateKey.pem");
            fs.writeFileSync(pathToPrivateKey, keyPair.privateKey.toString());
        }
    
        if( !fs.existsSync( path.join(path.resolve("keys"), "publicKey.pem"))){
            
            const pathToPublicKey =  path.join(path.resolve("keys"), "publicKey.pem");
            fs.writeFileSync(pathToPublicKey, keyPair.publicKey.toString() );
        }
    } catch (error) {
        if(process.env.CONTEXT_EXEC === 'development'){
            console.log(error);
        }
        throw new Error(error.message);
    }
}

exports.getKeyAndIvKey = (hashAlgo, hashEncode) =>{

    const key =  crypto
        .createHash(hashAlgo)
        .update(process.env.CIPHER_PASSPHRASE)
        .digest(hashEncode)
        .substring(0, 32);

    const keyIv = crypto
        .createHash(hashAlgo)
        .update(process.env.SECRET_IV)
        .digest(hashEncode)
        .substring(0, 16);

    return { key, keyIv }
}

exports.encryptFile = (pathTofile) =>{
    return new Promise((resolve, reject) =>{
        try {
            if(!fs.existsSync(pathTofile)){
                reject(new Error("invalid file path or file dosn't exist"))
            }
    
            const hashAlgo          =           process.env.HASH_ALG;
            const cryptAlgo         =           process.env.ENCRYPTION_METHOD;
            const hashEncode        =           process.env.HASH_DIGEST_ENCODE;
            const { key, keyIv }    =           this.getKeyAndIvKey(hashAlgo, hashEncode);
            const inputStream       =           fs.createReadStream(pathTofile);
    
            let allChunkData        =           [];
            
            const cipher            =           crypto.createCipheriv(cryptAlgo, key, keyIv);
    
            inputStream.on('readable', () => {
                let chunk;
                while (null !== (chunk = inputStream.read())) {
                    allChunkData.push(chunk);
                }
            });
              
            inputStream.on('end', () => {
                
                const buff = Buffer.concat(allChunkData);
                const cryptedContent  = Buffer.concat( [cipher.update(buff), cipher.final()] ).toString("base64");

                const fileNamecrpt          =    `${Utils.getDateInDDMMYYYY().replaceAll("/", "-")}_${Utils.getTimeNowInHHMMSS().replaceAll(":", "_")}`
                const pathToEncryptedFile   =      path.join(path.resolve('logEvents'), `${fileNamecrpt}.crypt`);
    
                fs.writeFileSync(pathToEncryptedFile, cryptedContent, { encoding: "utf8", flag: "w" });
                resolve(pathToEncryptedFile)
            });
    
        } catch (error) {
            reject(error.message)
        }
    })
}

exports.decryptfile = (pathTofile) =>{
    try {
        if(!fs.existsSync(pathTofile)){
            throw new Error("invalid file path or file dosn't exist");
        }

        const hashAlgo          =           process.env.HASH_ALG;
        const cryptAlgo         =           process.env.ENCRYPTION_METHOD;
        const hashEncode        =           process.env.HASH_DIGEST_ENCODE;
        const { key, keyIv }    =           this.getKeyAndIvKey(hashAlgo, hashEncode);

        const inputStream       =           fs.createReadStream(pathTofile);

        let allChunks           =           [];
        const decipher          =           crypto.createDecipheriv(cryptAlgo, key, keyIv);

        inputStream.on('readable', () => {
            let chunk;
            while (null !== (chunk = inputStream.read())) {
                allChunks.push(chunk);
            }
        });
          
        inputStream.on('end', () => {
            
            const buff = Buffer.concat(allChunks);

            const deCryptedContent = decipher.update(buff.toString("utf8"), "base64",  "utf8") + decipher.final("utf8");
            console.log(deCryptedContent);
        });

    } catch (error) {
        throw error;
    }
}

exports.signEncrypted = (pathToEncryptedFile, pathToPrivateKey) =>{
    return   new Promise((resolve, reject) =>{
        try {
            if(!fs.existsSync(pathToEncryptedFile) || !fs.existsSync(pathToPrivateKey)){
                reject("invalid params");
            }
            const privateKey                    =    fs.readFileSync(pathToPrivateKey, {encoding: 'utf8', flag: "r"});
            const encryptedDataInputStream      =    fs.createReadStream(pathToEncryptedFile);
            const hashAlgo                      =    process.env.HASH_ALG;
            //const hash                          =    crypto.createHash(hashAlgo);
            const sign                          =    crypto.createSign(hashAlgo);
    
            //let hashedFileToSign;
    
            encryptedDataInputStream.on('readable', () => {
                let chunk;
                while (null !== (chunk = encryptedDataInputStream.read())) {
                    //hash.update(chunk);
                    sign.update(chunk);
                }
            });
    
            encryptedDataInputStream.on("end", () =>{
                //hashedFileToSign = hash.digest();
                //sign.update(hashedFileToSign);
                
                sign.end();
    
                const signature                 =       sign.sign(crypto.createPrivateKey(privateKey));
                const pathToSignature           =       `${pathToEncryptedFile}.sign`;

                fs.writeFileSync(pathToSignature, signature.toString("base64"), { encoding: 'utf8', flag: "w" });
                resolve(pathToSignature)
            });
    
        } catch (error) {
            reject(error)
        }
    })
}

exports.verifyDataIntegrity = (pathToEncryptedFile,  pathToSignatureFile, pathToPublicKey) =>{
    return new Promise((resolve, reject) =>{
        try {
            if(!fs.existsSync(pathToEncryptedFile) || !fs.existsSync(pathToSignatureFile) || !fs.existsSync(pathToPublicKey)){
                reject("invalid params");
            }

            const publicKey                 =           fs.readFileSync(pathToPublicKey, {encoding: 'utf8', flag: "r"});
            const signature                 =           fs.readFileSync(pathToSignatureFile, {encoding: 'utf8', flag: "r"});
    
            const encryptedDataInputStream  =           fs.createReadStream(pathToEncryptedFile);
            const hashAlgo                  =           process.env.HASH_ALG;
            //const hash                    =           crypto.createHash(hashAlgo);
            const verify                    =           crypto.createVerify(hashAlgo);
    
            //let hashedFileToSign;
    
            encryptedDataInputStream.on('readable', () => {
                let chunk;
                while (null !== (chunk = encryptedDataInputStream.read())) {
                    //hash.update(chunk);
                    verify.update(chunk);
                }
            });
    
            encryptedDataInputStream.on("end", () =>{
                //hashedFileToSign = hash.digest();
                //verify.update(hashedFileToSign, "hex");
                verify.end();

                resolve( verify.verify(crypto.createPublicKey(publicKey), signature, "base64"))
            });
    
        } catch (error) {
            reject(error)
        }
    })
}