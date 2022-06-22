var bodyparser = require('body-parser');
var configs = require('../config/config');
var connection = require('./server/db/connection');
var routes = require('./server/routes/routes');
var city = require('./server/models/city');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server, {
    cors: {
      origin: "*",
      methods: ['GET', 'POST']
    }
  });

city.setParent(io);

app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());

server.listen(configs.NODEJS_PORT, function() {
    console.log('%s: Node server started on port %s ', Date(Date.now()), configs.NODEJS_PORT);

    connection.init();
    routes.configure(app);

    // set default route
    app.get('/', function(req, res) {
        res.status(200).json({
            message: 'Node server started on: ' + Date(Date.now())
        });
    });

});