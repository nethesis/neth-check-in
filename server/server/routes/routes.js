var city = require('../models/city');
var country = require('../models/country');
var configs = require('../../config/config');

module.exports = {
    configure: function (app) {
        app.get('/country/', function (req, res) {
            country.getAll(res);
        });
        app.get('/country/:code/geojson', function (req, res) {
            country.getGeoJSONCoordinates(req.params.code, res);
        })

        app.get('/city/', function (req, res) {
            city.getAll(res);
        });

        app.get('/city/:id', function (req, res) {
            city.get(req.params.id, res);
        });

        app.post('/city/', function (req, res) {
            if (req.body.secret === configs.SECRET) {
                delete req.body.secret;
                city.create(req.body, res);
            } else {
                res.status(403).json({
                    message: 'Invalid secret'
                });
            }
        });

        app.put('/city/:id', function (req, res) {
            if (req.body.secret === configs.SECRET) {
                delete req.body.secret;
                city.update(req.params.id, req.body, res);
            } else {
                res.status(403).json({
                    message: 'Invalid secret'
                });
            }
        });

        app.delete('/city/:id/', function (req, res) {
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