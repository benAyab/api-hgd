'use strict';
//generate 16 bytes token with crypto library

module.exports = (nbBytes = 16) => require('node:crypto').randomBytes(nbBytes).toString('hex');