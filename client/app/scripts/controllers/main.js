'use strict';

/**
 * @ngdoc function
 * @name nethCheckInApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the nethCheckInApp
 */
angular.module('nethCheckInApp')
    .controller('MainCtrl', function($scope, $filter, $http, NgTableParams, $location) {

        $scope.isLoading = true;
        $scope.isError = false;
        $scope.tableParams = undefined;
        $scope.newUser = undefined;
        $scope.ipServer = 'http://' + CONFIGS.IP + ':' + CONFIGS.NODEJS_PORT;
        $scope.save = undefined;
        $scope.disabled = true;
        $scope.totalCheckin = 0;
        $scope.doneCheckin = 0;
        $scope.percentCheckin = 0;
        window.jsPDF = window.jspdf.jsPDF;

        $http.get($scope.ipServer + '/iscritti').then(function(successData) {
            // get raw data from server
            $scope.data = successData.data;

            // hide loader 
            $scope.isLoading = false;
            $scope.isError = false;
            $scope.search = {
                term: ''
            };

            $scope.tableParams = new NgTableParams({
                count: 1000
            }, {
                total: $scope.data.length,
                data: $scope.data
            });

        }, function(errorData) {
            // hide loader 
            console.log(errorData);
            $scope.isLoading = false;
            // show error message
            $scope.isError = true;
        });

        socket.on("iscrittiUpdate", function() {
            console.log("EVENT");

            $http.get($scope.ipServer + '/iscritti').then(function(successData) {
                // get raw data from server
                $scope.data = successData.data;
                $scope.tableParams = new NgTableParams({
                    count: 1000
                }, {
                    total: $scope.data.length,
                    data: $scope.data
                });
            }, function(errorData) {
                // hide loader 
                console.log(errorData);
            });

            $scope.statUpdate();
        });


        var printPDF = function (name, surname, agency, type, location, attendeeCode) {

            if (!agency) agency = ""
            var isProspect = type && type.toLowerCase() === 'prospect'
            var isSponsor = type && type.toLowerCase() === 'sponsor'

            var nameArr = name.toLowerCase().split(' ')
            var newNameArr = nameArr.map(name => name.charAt(0).toUpperCase() + name.slice(1))
            name = newNameArr.join(" ")

            if (name.length > 12) {
                name = name.substring(0, 12).trim() + '..';
            }

            var surnameArr = surname.toLowerCase().split(' ')
            var newSurnameArr = surnameArr.map(surname => surname.charAt(0).toUpperCase() + surname.slice(1))
            surname = newSurnameArr.join(" ")

            if (surname.length > 12) {
                surname = surname.substring(0, 12).trim() + '..';
            }

            agency = agency.toUpperCase().trim()
            if (isSponsor) {
                if (agency.length > 26) {
                    agency = agency.substring(0, 26).trim() + "..";
                }
            } else {
                if (agency.length > 29) {
                    agency = agency.substring(0, 29).trim() + "..";
                }
            }

            var fromLeft = 3
            var fromTop = 24

	        // old configurations:
	        // format: [62, 32] 
            var pdf = new jsPDF({
                orientation: 'l',
                unit: 'mm',
                format: [62, 50]
            })

            var pages = 2

            for (var i = 0; i < pages; i++) {
                if (i !== 0) pdf.addPage()

                pdf.addFileToVFS('Changa.ttf', CHANGA);
                pdf.addFont('Changa.ttf', 'Changa', 'normal');
                pdf.setFont('Changa', 'normal');

                const qrSize = 24;
    		    const qrX = 2;
    		    const qrY = 0;
		
                if (attendeeCode != -1) {
                    var textAttendeeCode = String(attendeeCode)
		            let q = qrcode(0, 'H');
		            q.addData(textAttendeeCode);
	                q.make();

        		    const imgTag = q.createImgTag(6);
		            const imgSrc = imgTag.match(/src="(.*?)"/)[1];

    		        

    		        pdf.addImage(imgSrc, 'PNG', qrX, qrY, qrSize, qrSize);
                }

                pdf.setFontSize(21);
                pdf.text(name, fromLeft, 5 + fromTop);
                pdf.text(surname, fromLeft, 12 + fromTop);

                pdf.addFileToVFS('Cuprum.ttf', CUPRUM);
                pdf.addFont('Cuprum.ttf', 'Cuprum', 'normal');
                pdf.setFont('Cuprum', 'normal');
                
                pdf.setFontSize(12);
                var textAgency = agency
                if (isSponsor) textAgency = agency + '(S)'
                pdf.text(textAgency, fromLeft, 18 + fromTop);

                pdf.setFontSize(11);
		        const locationX = qrX + qrSize + 3;
		        const locationY = qrY + 6;
                pdf.text(location, locationX, locationY);

                if (isProspect) {
			        const lineY = 19 + fromTop;
			        const lineLength = textAgency.length * 2.8;
			        pdf.setDrawColor(0);
			        pdf.setLineWidth(0.5);
			        pdf.line(fromLeft, lineY, fromLeft + lineLength, lineY);
		        }
            }

            pdf.autoPrint();
            $scope.mywindow = window.open(pdf.output('bloburl'), '_blank');
        }

        $scope.functionCheckin = function(stato, id, name, surname, agency, type, location) {
            $http.get($scope.ipServer + '/printed/' + id).then(function(successData) {
                let serverResponse = successData.data;
                printPDF(name, surname, agency, type, location, serverResponse.code.codice)
            }, function(errorData) {
                // error handling
            });
        }

        $scope.functionRePrint = function(id) {
            $http.get($scope.ipServer + '/checkin/' + id).then(function(successData) {
                //reset status
            }, function(errorData) {
                //error
            });
        }

        $scope.statUpdate = function() {
            $http.get($scope.ipServer + '/stats/').then(function(successData) {
                $scope.totalCheckin = successData.data.result[0].total;
                $scope.doneCheckin = successData.data.result[0].done;
                $scope.percentCheckin = Math.floor(100 / $scope.totalCheckin * $scope.doneCheckin);
            }, function(errorData) {
                //error
            });
        }

        $scope.showNewForm = function() {
            if ($scope.newUser) {
                $scope.newUser = false;
                document.getElementById('searchInput').focus()
            } else {
                $scope.newUser = true;
                setTimeout(function () {
                    document.getElementById('inputname').focus()
                },
                100)
            }
        }

        $scope.change = function() {
            $scope.disabled = false;
            $scope.save = undefined;
        }

        $scope.createAttendee = function(newname, newsurname, newagency) {
            if (newname && newsurname && newagency) {
                $http.get($scope.ipServer + '/newattendee/' + newname + '/' + newsurname + '/' + newagency).then(function(successData) {
                    $scope.save = true;
                    $scope.disabled = true;
            	    $scope.newUser = false;
            	    printPDF(newname, newsurname, newagency, "", "", -1)
                }, function(errorData) {
                    $scope.save = false;
                    return;
                });
            } else {
                $scope.save = false;
            }
        }

        $scope.structure = `{
            "nome": 1,
            "cognome": 2,
            "email": 3,
            "sala": 5,
            "tipo": 7,
            "agency": 8
}`

        $scope.exportStructure = `nome, cognome, email, sala, tipo, agency`

        $scope.ignoreFirst = false

        $scope.clickFileCsv = function () {
            document.querySelector('#fileCsv').click()
        }

        var inputValChange = function () {
            var csvInput = document.querySelector('#fileCsv')
            $scope.fileName = csvInput.files[0].name
            $scope.$apply()
        }

        $scope.importCSV = function () {
            var formData = new FormData();
            var csvInput = document.querySelector('#fileCsv')
            formData.append('csvFile', csvInput.files[0], csvInput.files[0].name);
            formData.append('struct', $scope.structure)            
            formData.append('ignoreFirst', $scope.ignoreFirst)      
            // Send the request      
            fetch($scope.ipServer + '/upload', {
                method: 'POST',
                body: formData
            })
            .then(data => {
                $scope.showImportModal = false
                $scope.$apply()
            })
            .catch(err => {console.error(error)})
        }

        $scope.exportCSV = function () {
            // Send the request      
            fetch($scope.ipServer + '/download?' + new URLSearchParams({
                fields: $scope.exportStructure
            }))
            .then(data => {
                data.blob().then((blob) => {
                    const newBlob = new Blob([blob])
                    const blobUrl = window.URL.createObjectURL(newBlob)
                    const link = document.createElement('a')
                    link.href = blobUrl;
                    link.setAttribute('download', `nethcheckin.csv`)
                    document.body.appendChild(link)
                    link.click();
                    link.parentNode.removeChild(link)
                    window.URL.revokeObjectURL(blobUrl);
                    $scope.showExportModal = false
                    $scope.$apply()
                });
            })
            .catch(err => {console.error(err)})
        }

        $scope.statUpdate();
        $scope.baseUrl = "https://" + $location.host() + "/phpmyadmin/sql.php?db=nethcheckin&table=iscritti";
        angular.element(document).ready(function () {
            document.getElementById('searchInput').focus()
            var csv = document.querySelector('#fileCsv')
            csv.addEventListener('change', inputValChange)
        });

    });
