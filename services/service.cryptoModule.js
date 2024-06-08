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

    const key =             crypto
        .createHash(hashAlgo)
        .update(process.env.CIPHER_PASSPHRASE)
        .digest(hashEncode)
        .substring(0, 32);

    const keyIv =             crypto
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
    
            const hashAlgo =        process.env.HASH_ALG;
            const cryptAlgo =       process.env.ENCRYPTION_METHOD;
            const hashEncode =      process.env.HASH_DIGEST_ENCODE;
            const { key, keyIv } =  this.getKeyAndIvKey(hashAlgo, hashEncode);
            const inputStream =     fs.createReadStream(pathTofile);
    
            let allChunkData =      [];
            
            const cipher =          crypto.createCipheriv(cryptAlgo, key, keyIv);
    
            inputStream.on('readable', () => {
                let chunk;
                while (null !== (chunk = inputStream.read())) {
                    allChunkData.push(chunk);
                }
            });
              
            inputStream.on('end', () => {
                
                const buff = Buffer.concat(allChunkData);
    
                const cryptedContent = Buffer.from(
                    cipher.update(buff.toString("utf8"), 'utf8', hashEncode) + cipher.final(hashEncode)
                ).toString('utf8');
    
                const fileNamecrpt =    `${Utils.getDateInDDMMYYYY().replaceAll("/", "-")}_${Utils.getTimeNowInHHMMSS().replaceAll(":", "_")}`
                const pathToFile =      path.join(path.resolve('logEvents'), `${fileNamecrpt}.crypt`);
    
                fs.writeFileSync(pathToFile, cryptedContent, { encoding: 'utf8', flag: "w" });
                resolve(pathTofile)
            });
    
        } catch (error) {
            reject(error)
        }
    })
}

exports.decryptfile = (pathTofile) =>{
    try {
        if(!fs.existsSync(pathTofile)){
            throw new Error("invalid file path or file dosn't exist");
        }

        const hashAlgo =        process.env.HASH_ALG;
        const cryptAlgo =       process.env.ENCRYPTION_METHOD;
        const hashEncode =      process.env.HASH_DIGEST_ENCODE;
        const { key, keyIv } =  this.getKeyAndIvKey(hashAlgo, hashEncode);

        const inputStream =     fs.createReadStream(pathTofile);

        let allChunks =         [];
        const decipher =        crypto.createDecipheriv(cryptAlgo, key, keyIv)

        inputStream.on('readable', () => {
            let chunk;
            while (null !== (chunk = inputStream.read())) {
                allChunks.push(chunk);
            }
        });
          
        inputStream.on('end', () => {
            //const content = chunks.join('');
            const buff = Buffer.concat(allChunks);

            const deCryptedContent = decipher.update(buff.toString("utf8"), 'hex', "utf8") + decipher.final('utf8');

        });

    } catch (error) {
        throw error;
    }
}

exports.signEncrypted = (pathToEncryptedFile, pathToPrivateKey) =>{
    try {
        if(!fs.existsSync(pathToEncryptedFile) || !fs.existsSync(pathToPrivateKey)){
            throw new Error("invalid params");
        }
        const privateKey = fs.readFileSync(pathToPrivateKey, {encoding: 'utf8', flag: "r"});
        
        const encryptedDataInputStream =        fs.createReadStream(pathToEncryptedFile);
        const hashAlgo =                        process.env.HASH_ALG;
        const hash =                            crypto.createHash(hashAlgo);

        let hashedFileToSign;

        encryptedDataInputStream.on('readable', () => {
            let chunk;
            while (null !== (chunk = encryptedDataInputStream.read())) {
                hash.update(chunk);
            }
        });

        encryptedDataInputStream.on("end", () =>{
            hashedFileToSign = hash.digest("hex");

            const sign =  crypto.createSign(hashAlgo);
            sign.update(hashedFileToSign, "hex");
            sign.end();

            const signature = sign.sign(privateKey);
            fs.writeFileSync(`${pathToEncryptedFile}.sign`, signature.toString("hex"), { encoding: 'utf8', flag: "w" });
        });

    } catch (error) {
        throw error
    }
}

exports.verifyDataIntegrity = (pathToEncryptedFile,  pathToSignatureFile, pathToPublicKey) =>{
    return new Promise((resolve, reject) =>{
        try {
            reject(new Error("invalid params"))
            const publicKey = fs.readFileSync(pathToPublicKey, {encoding: 'utf8', flag: "r"});
            const signature =  fs.readFileSync(pathToSignatureFile, {encoding: 'utf8', flag: "r"});
    
            const encryptedDataInputStream =        fs.createReadStream(pathToEncryptedFile);
            const hashAlgo =                        process.env.HASH_ALG;
            const hash =                            crypto.createHash(hashAlgo);
    
            let hashedFileToSign;
    
            encryptedDataInputStream.on('readable', () => {
                let chunk;
                while (null !== (chunk = encryptedDataInputStream.read())) {
                    hash.update(chunk);
                }
            });
    
            encryptedDataInputStream.on("end", () =>{
                hashedFileToSign = hash.digest("hex");
                const verify = crypto.createVerify(process.env.HASH_ALG);
    
                verify.update(hashedFileToSign, "hex");
                verify.end();

                resolve(verify.verify(publicKey, signature))
            });
    
        } catch (error) {
            reject(error)
        }
    })
}