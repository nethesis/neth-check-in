var connection = require('../db/connection');
var utils = require('../utils/utils')

function Country() {
    this.getAll = function (res) {
        connection.acquire(function (err, con) {
            con.query('SELECT country_code FROM city GROUP BY country_code', function (err, result) {
                con.release();
                if (err) {
                    res.status(500).json({
                        message: 'Get all countries failed: ' + err
                    });
                } else {
                    res.status(200).json(result);
                }
            });
        });
    };

    this.getGeoJSONCoordinates = function (code, res) {
        res.status(200).json(
            utils.getFile('../geojson/' +
                utils.countryCodeToAlpha3(code) +
                '.json'
            ).features[0].geometry);
    };
}

module.exports = new Country();