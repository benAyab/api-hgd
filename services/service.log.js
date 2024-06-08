const path = require("path");
const fs = require("node:fs");

const Utils = require("../helpers/utils");

const appendToLog = (data) =>{
    const pathToFile = path.join(path.resolve('log'), Utils.getDateInDDMMYYYY().replaceAll("/", "-")+".log");
    const contentToAppend = `${Utils.getTimeNowInHHMMSS()} ${data}\n`;
    fs.appendFileSync(pathToFile, contentToAppend);
}

module.exports = appendToLog;