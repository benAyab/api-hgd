const loki = require("lokijs");

const db = new loki('hgdapi.db');

// Add a collection to the database
const users = db.addCollection('users');
const fileDescCollec = db.addCollection('filedesc')

exports.usersdb = users;
exports.fileDescCollec = fileDescCollec;