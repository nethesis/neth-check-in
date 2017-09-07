var express = require('express');
var bodyparser = require('body-parser');

var configs = require('./config/config');
var connection = require('./server/db/connection');
var routes = require('./server/routes/routes');

var city = require('./server/models/city');

var app = express();
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());

var server = app.listen(configs.NODEJS_PORT, configs.NODEJS_IP, function () {
    console.log('%s: Node server started on %s:%d ...', Date(Date.now()), configs.NODEJS_IP, configs.NODEJS_PORT);

    connection.init();
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", configs.ALLOWED_ORIGIN);
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header('Access-Control-Allow-Methods', configs.ALLOWED_VERBS.join(','))
        next();
    });
    routes.configure(app);

    // init model table
    city.initTable();

    // set default route
    app.get('/', function (req, res) {
        res.status(200).json({
            message: 'Node server started on: ' + Date(Date.now())
        });
    });

});