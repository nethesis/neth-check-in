var connection = require('../db/connection');
var parent;

function setParent(io) {
    parent = io;
}

function City() {


    this.getAll = function(res) {
        connection.acquire(function(err, con) {
            con.query('SELECT * FROM iscritti', function(err, result) {
                con.release();
                if (err) {
                    res.status(500).json({
                        message: 'Db select error: ' + err
                    });
                } else {
                    res.status(200).json(result);
                }
            });
        });
    };


    this.updateStatus = function(id, stat, res) {
        connection.acquire(function(err, con) {
            con.query('UPDATE iscritti SET stato="' + stat + '" WHERE id =' + id, function(err, result) {
                con.release();
                if (err) {
                    res.status(500).json({
                        message: 'City creation failed: ' + err
                    });
                } else {
                    res.status(201).json({
                        message: 'City created successfully',
                        id: result.insertId
                    });
                    parent.emit('iscrittiUpdate');
                }
            });
        });
    };


    this.selectStat = function(res) {
        connection.acquire(function(err, con) {
            con.query('SELECT(SELECT COUNT( * ) FROM iscritti) AS total,(SELECT COUNT( * ) FROM iscritti WHERE stato="Check-in eseguito") AS done', function(err, result) {
                con.release();
                if (err) {
                    res.status(500).json({
                        message: 'City creation failed: ' + err
                    });
                } else {
                    res.status(201).json({
                        result: result
                    });
                }
            });
        });
    };


    this.insertAttendee = function(name, surname, agency, res) {
        if (name != "" && surname != "" && agency != "") {
            connection.acquire(function(err, con) {
                con.query('INSERT INTO iscritti (nome, cognome, stato, agency) VALUES ("' + name + '", "' + surname + '", "Check-in eseguito", "' + agency + '")', function(err, result) {
                    con.release();
                    if (err) {
                        res.status(500).json({
                            message: 'City creation failed: ' + err
                        });
                    } else {
                        res.status(201).json({
                            message: 'City created successfully'
                        });
                        parent.emit('iscrittiUpdate');
                    }
                });
            });
        } else {
            res.status(500).json({
                message: 'Failed'
            });
        }
    };
}

module.exports = new City();
module.exports.setParent = setParent;