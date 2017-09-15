var city = require('../models/city');
var country = require('../models/country');
var configs = require('../../config/config');

module.exports = {
    configure: function(app) {
        
        app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        app.get('/iscritti/', function(req, res) {
            city.getAll(res);
        });

        app.get('/checkin/:id', function(req, res) {
            city.updateStatus(req.params.id, "Partecipante", res);
        });

        app.get('/printed/:id', function(req, res) {
            city.updateStatus(req.params.id, "Check-in eseguito", res);
        });

        app.post('/city/', function(req, res) {
            if (req.body.secret === configs.SECRET) {
                delete req.body.secret;
                city.create(req.body, res);
            } else {
                res.status(403).json({
                    message: 'Invalid secret'
                });
            }
        });

        app.put('/city/:id', function(req, res) {
            if (req.body.secret === configs.SECRET) {
                delete req.body.secret;
                city.update(req.params.id, req.body, res);
            } else {
                res.status(403).json({
                    message: 'Invalid secret'
                });
            }
        });

        app.delete('/city/:id/', function(req, res) {
            if (req.body.secret === configs.SECRET) {
                delete req.body.secret;
                city.delete(req.params.id, res);
            } else {
                res.status(403).json({
                    message: 'Invalid secret'
                });
            }
        });


    }
};