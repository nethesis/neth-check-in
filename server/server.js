var express = require('express');
var bodyparser = require('body-parser');

var configs = require('./config/config');
var connection = require('./server/db/connection');
var routes = require('./server/routes/routes');

var city = require('./server/models/city');

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var parent = {
    socket: null
};

city.setParent(parent);

app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());

server.listen(configs.NODEJS_PORT, configs.NODEJS_IP, function() {
    console.log('%s: Node server started on %s:%d ...', Date(Date.now()), configs.NODEJS_IP, configs.NODEJS_PORT);

    connection.init();
    routes.configure(app);

    // init model table
    city.initTable();

    // set default route
    app.get('/', function(req, res) {
        res.status(200).json({
            message: 'Node server started on: ' + Date(Date.now())
        });
    });

    io.on('connection', function(socket) {
        parent.socket = socket;
    });

});