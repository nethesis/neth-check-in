var connection = require('../db/connection');
var csvParse = require('csv-parse').parse
var fs = require('fs'); 
var json2csv = require('json2csv')    
var parser = json2csv.Parser

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
	    let skip = false;

        if (name != "" && surname != "" && agency != "") {
           connection.acquire(function(err, conn) {
		        let toForward = {};
		        conn.query('SELECT cod_partecipante, sala, tipo FROM iscritti WHERE nome = "' + name + '" AND cognome = "' + surname + '" AND agency = "' + agency + '"', function(err, result) {
		   	        if (err) {
				        skip = true;
				        res.status(500).json({
					        message: 'DB select error: ' + err
				        })
			        } else {
				        toForward = {
					        codice: result[0].cod_partecipante,
					        sala:   result[0].sala,
					        tipo:   result[0].tipo
				        };
			        }

		        })

                if (skip) {
                    return;
                }

                conn.query('INSERT INTO iscritti (nome, cognome, stato, agency) VALUES ("' + name + '", "' + surname + '", "Check-in eseguito", "' + agency + '")', function(err, result) {
                    conn.release();
                    if (err) {
                        res.status(500).json({
                            message: 'City creation failed: ' + err
                        });
                    } else {
                        res.status(201).json({
                            message: toForward
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

    this.upload = function(req, res) {
        try {
            const mappedStruct = JSON.parse(req.body.struct)

            const fileData = fs.readFileSync(req.file.path)
            const ignoreFirst =  typeof req.body.ignoreFirst === 'string' ? req.body.ignoreFirst === 'true' : req.body.ignoreFirst
            // Parse csv
            csvParse(fileData, (err, data) => {
                try {
                    connection.acquire(function(err, con) {
                        try {
                            // Check errors
                            if (err) throw new Error(err)

                            // Check ignore first row
                            if (ignoreFirst) data.splice(0, 1)

                            data.map((el, index) => {
                                const row = {}
                                for (let col in mappedStruct) {
                                    const value = el[mappedStruct[col]]
                                    row[col] = value || ''
                                }

                                const errors = []
                                // Insert rows
                                con.query(
                                    'INSERT INTO iscritti (nome, cognome, email, stato, sala, tipo, agency) VALUES ("' + row.nome + '", "' + row.cognome + '", "' + row.email + '", "Partecipante", "' + row.sala + '", "' + row.tipo + '", "' + row.agency + '")',
                                    (err) => {
                                        if (err) errors.push(err) 
                                    }
                                )

                                if (index === data.length-1) {
                                    if (errors.length > 0) {
                                        // Return 200 with errors
                                        res.status(200).json({message: 'Uploaded', withErrors: errors})
                                    } else {
                                        // Return 200
                                        res.status(200).json({message: 'Uploaded'})
                                    }
                                }
                            })
                        } catch (err) {
                            res.status(500).json({error: err})
                        }
                    })
                } catch (error) {
                    res.status(500).json({error: err})
                }
            })
        } catch (err) {
            res.status(500).json({error: err})
        }
    }

    this.download = function (req, res) {
        try {
            connection.acquire(function(err, con) {
                try {
                    // Get rows
                    con.query(
                        'SELECT * FROM iscritti',
                        (err, data) => {
                            if (err) {
                                res.status(500).json({ error: err});
                            } else {
                                var fields = req.query.fields.split(',').map(el => el.trim())
                                var json2csv = new parser({ fields })
                                const csv = json2csv.parse(data);
                                res.header('Content-Type', 'text/csv');
                                res.attachment('nethcheckin.csv');
                                res.status(200).send(csv);
                            }
                        }
                    )
                } catch (err) {
                    res.status(500).json({error: err})
                }
            })

        } catch (error) {
            res.status(500).json({error: error})
        }
    }
}

module.exports = new City();
module.exports.setParent = setParent;
