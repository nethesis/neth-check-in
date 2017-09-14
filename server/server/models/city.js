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

    this.create = function(city, res) {
        connection.acquire(function(err, con) {
            con.query('SELECT * FROM city WHERE formatted_address = ?', city.formatted_address, function(err, result) {
                if (err) {
                    res.status(500).json({
                        message: 'City creation failed: ' + err
                    });
                } else {
                    if (result.length > 0) {
                        con.query('UPDATE city SET ? WHERE id = ?', [city, result[0].id], function(err, result) {
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
                            }
                        });
                    } else {
                        con.query('INSERT INTO city SET ?', city, function(err, result) {
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
                            }
                        });
                    }
                }
            })
        });
    };

    this.update = function(id, city, res) {
        connection.acquire(function(err, con) {
            con.query('UPDATE city SET ? WHERE id = ?', [city, id], function(err, result) {
                con.release();
                if (err) {
                    res.status(500).json({
                        message: 'City update failed: ' + err
                    });
                } else {
                    res.status(200).json({
                        message: 'Updated successfully'
                    });
                }
            });
        });
    };

    this.delete = function(id, res) {
        connection.acquire(function(err, con) {
            con.query('DELETE FROM city WHERE id = ?', [id], function(err, result) {
                con.release();
                if (err) {
                    res.status(500).json({
                        message: 'City deletion failed: ' + err
                    });
                } else {
                    res.status(200).json({
                        message: 'Deleted successfully'
                    });
                }
            });
        });
    };

    this.initTable = function() {
        connection.acquire(function(err, con) {
            if (err) throw err;
            con.query([
                'CREATE TABLE IF NOT EXISTS `city` (',
                '`id` BIGINT(20) NOT NULL AUTO_INCREMENT,',
                '`name` VARCHAR(100) CHARACTER SET utf8 NOT NULL DEFAULT "",',
                '`formatted_address` VARCHAR(150) CHARACTER SET utf8 NULL DEFAULT "",',
                '`country_code` VARCHAR(2) CHARACTER SET utf8 NOT NULL DEFAULT "",',
                '`lat` DECIMAL(16,14) NOT NULL,',
                '`lng` DECIMAL(16,14) NOT NULL,',
                'PRIMARY KEY (`id`)',
                ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
            ].join(' '), function(err, result) {
                if (err) throw err;

                if (!result.warningCount)
                    console.log('Table CITY created with success');

                con.release();
                return true;
            });
        });
    }
}

module.exports = new City();
module.exports.setParent = setParent;