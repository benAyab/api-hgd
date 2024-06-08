const path =                require("path");
const fs =                  require("node:fs");

const Utils =               require("../helpers/utils");

const { fileDescCollec } =  require("../config/inmemodb");
const { encryptFile } = require("./service.cryptoModule");

/***
 * Function to insert new to log server events file
 * input: data : String, content to append
 * output; void
 */
const appendEventsToLog = async (data) =>{
    try {
        let onEditFileName = "";

        //resolving absolute path to log file descriptor
        const pathToDescFileLog = path.join(path.resolve('helpers'), "logFileDesc.txt");

        //let get indexed log file from in memory data 
        const fileDesc = fileDescCollec.findOne({id: 1});

        //if this file is created and exits get its name
        if(fileDesc && fileDesc.fileName){
            onEditFileName = fileDesc.fileName;
        }
        else{
           
            if( !fs.existsSync(pathToDescFileLog)){
                onEditFileName = Utils.getDateInDDMMYYYY().replaceAll("/", "-")+".txt";
                const contentToAppend = { fileName: onEditFileName };

                fs.writeFileSync(pathToDescFileLog, JSON.stringify(contentToAppend), { encoding: 'utf8', flag: "w" });
                fileDescCollec.insertOne({id: 1, fileName: onEditFileName});
            }
            else{
                const data = fs.readFileSync(pathToDescFileLog, {encoding: 'utf8', flag: "r"});
                const fileDescriptor = JSON.parse(data);

                if(fileDescriptor.fileName){
                    onEditFileName = fileDescriptor.fileName;
                    fileDescCollec.insertOne({id: 1, fileName: onEditFileName});
                }
            }
        }

        //resolving absolute path to events log file
        const pathToFile = path.join(path.resolve('logEvents'), onEditFileName);

        const contentToAppend = `**************\n${data}\n**************\n`;
        fs.appendFileSync(pathToFile, contentToAppend);

        if(fs.existsSync(pathToFile) && fs.statSync(pathToFile).size >= process.env.MAX_LOG_FILE_SIZE){
            //#1 encrypt this log file
           await encryptFile(pathToFile);
            //#2 delete it from disk
            fs.unlinkSync(pathToFile);
            fs.unlinkSync(pathToDescFileLog);

            //#3 create new file where will write new event 
            //onEditFileName = Utils.getDateInDDMMYYYY().replaceAll("/", "-")+".txt";
            //const contentToAppend = { fileName: onEditFileName }
            //fs.writeFileSync(pathToDescFileLog, JSON.stringify(contentToAppend), { encoding: 'utf8', flag: "w" });

            //remove deleted file log from in-memory database
            //do this first ensure that we will not enconter error event empty collection
            fileDescCollec.findAndRemove( {id: 1} );

            //now insert it
            //fileDescCollec.insertOne({id: 1, fileName: onEditFileName});
        }

    } catch (error) {
        throw error
    }
}

module.exports = appendEventsToLog;