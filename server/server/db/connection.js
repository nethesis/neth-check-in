var mysql = require('mysql');
var configs = require('../../../config/config');

function Connection() {
    this.pool = null;

    this.init = function () {
        this.pool = mysql.createPool({
            connectionLimit: 10,
            host: configs.MYSQL_DB_HOST,
            port: configs.MYSQL_DB_PORT,
            user: configs.MYSQL_DB_USERNAME,
            password: configs.MYSQL_DB_PASSWORD,
            database: configs.MYSQL_DB_NAME
        });
    };

    this.acquire = function (callback) {
        this.pool.getConnection(function (err, connection) {
            callback(err, connection);
        });
    };
}

module.exports = new Connection();
