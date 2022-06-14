var express = require('express');
var bodyparser = require('body-parser');

var configs = require('./config/config');
var connection = require('./server/db/connection');
var routes = require('./server/routes/routes');

var city = require('./server/models/city');

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server, {
    cors: {
      origin: "*",
      methods: ['GET', 'PUT', 'POST']
    }
  });

city.setParent(io);

app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());

app.use(express.static('../client'));
app.use('/app/bower_components/ng-table/dist' ,express.static('../client/bower_components/ng-table/dist'));
app.use('/app/bower_components/angular' ,express.static('../client/bower_components/angular'));
app.use('/app/bower_components/angular-route' ,express.static('../client/bower_components/angular-route'));
app.use('/app/bower_components/angular-sanitize' ,express.static('../client/bower_components/angular-sanitize'));
app.use('/app/bower_components/jspdf/dist' ,express.static('../client/bower_components/jspdf/dist'));

server.listen(configs.NODEJS_PORT, configs.NODEJS_IP, function() {
    console.log('%s: Node server started on %s:%d ...', Date(Date.now()), configs.NODEJS_IP, configs.NODEJS_PORT);

    connection.init();
    routes.configure(app);

    // set default route
    app.get('/', function(req, res) {
        res.status(200).json({
            message: 'Node server started on: ' + Date(Date.now())
        });
    });

    io.on('connection', function(socket) {
        console.log(socket);
    });

});