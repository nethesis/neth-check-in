var fs = require('fs');
var countries = require("i18n-iso-countries");

function Utils() {
    this.readJsonFileSync = function (filepath, encoding) {
        if (typeof (encoding) == 'undefined') {
            encoding = 'utf8';
        }
        var file = fs.readFileSync(filepath, encoding);
        return JSON.parse(file);
    }

    this.getFile = function (file) {
        var filepath = __dirname + '/' + file;
        return this.readJsonFileSync(filepath);
    }

    this.countryCodeToAlpha3 = function (code) {
        return countries.alpha2ToAlpha3(code.toUpperCase());
    };
}

module.exports = new Utils();