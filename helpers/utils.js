exports.getDateInDDMMYYYY = () => {
    const date = new Date(Date.now());
    return `${this.appendZeroToInt(date.getDate())}/${this.appendZeroToInt(date.getMonth() + 1)}/${date.getFullYear()}`  
}

exports.getDateInDDMonthNameYYYY = (d = null) => {
    if(!d || d === ""){
        return "";
    }
    const date = new Date(d);
    return `${this.appendZeroToInt(date.getDate())},  ${montNames[date.getMonth()]}  ${date.getFullYear()}`  
}

exports.getGivingDateInDDMMYYYY = (d = null) => {
    if(!d){
        return "";
    }
    const date = new Date(d);
    return `${this.appendZeroToInt(date.getDate())}/${this.appendZeroToInt(date.getMonth() + 1)}/${date.getFullYear()}`  
}

exports.getTimeNowInHHMMSS = () =>{
    const date = new Date(Date.now());
    return `${this.appendZeroToInt(date.getHours())}:${this.appendZeroToInt(date.getMinutes())}:${this.appendZeroToInt(date.getSeconds())}` 
}

exports.appendZeroToInt = (n = 0) => {
    return (n < 10)? `0${n}` : `${n}`
} 

const montNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Decembre"]