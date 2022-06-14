var city = require('../models/city');

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

        app.get('/stats/', function(req, res) {
            city.selectStat(res);
        });

        app.get('/newattendee/:name/:surname/:agency', function(req, res) {
            city.insertAttendee(req.params.name, req.params.surname, req.params.agency, res);
        });

        app.get('/printed/:id', function(req, res) {
            city.updateStatus(req.params.id, "Check-in eseguito", res);
        });

    }
};