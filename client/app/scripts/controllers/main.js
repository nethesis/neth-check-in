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
        $scope.ipServer = 'http://172.25.5.78:8080';
        $scope.save = undefined;
        $scope.disabled = true;
        $scope.totalCheckin = 0;
        $scope.doneCheckin = 0;
        $scope.percentCheckin = 0;

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

        document.body.style.zoom = "110%";

        var printPDF = function (name, surname, agency, type) {

            if (!agency) agency = ""
            var isProspect = type && type.toLowerCase() === 'prospect'
            var isSponsor = type && type.toLowerCase() === 'sponsor'

            name = name.toLowerCase();
            name = name.charAt(0).toUpperCase() + name.slice(1);
            surname = surname.toLowerCase();
            surname = surname.charAt(0).toUpperCase() + surname.slice(1);
            agency = agency.trim();

            if (name === name.toUpperCase() && name.length > 14) {
                name = name.substring(0, 14);
            }
            if (surname === surname.toUpperCase() && surname.length > 14) {
                surname = surname.substring(0, 14);
            }
            if (agency === agency.toUpperCase() && agency.length > 14) {
                agency = agency.substring(0, 14);
            }
            if (agency.length > 17) {
                agency = agency.substring(0, 17);
            }
            var pdf = new jsPDF("h1", "mm", [42, 20]);

            var pages = 2

            for (var i = 0; i < pages; i++) {
                if (i !== 0) pdf.addPage()

                pdf.setFontStyle("bold");
                pdf.setFontSize(18);
                pdf.text(name, 0, 5);
                pdf.text(surname, 0, 12);
                pdf.setFontStyle("italic");
                pdf.setFontSize(13);

                var textAgency = agency
                if (isSponsor) textAgency = agency + ' (S)'

                pdf.text(textAgency, 0, 18);
                if (isProspect) pdf.line(0, 19, 20, 19);

            }

            pdf.autoPrint();
            $scope.mywindow = window.open(pdf.output('bloburl'), '_blank');
        }

        $scope.functionCheckin = function(stato, id, name, surname, agency, type) {
            $http.get($scope.ipServer + '/printed/' + id).then(function(successData) {
                //print
            }, function(errorData) {
                //errpr
            });
            printPDF(name, surname, agency, type)
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
            } else {
                $scope.newUser = true;
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
                }, function(errorData) {
                    $scope.save = false;
                    return;
                });
            } else {
                $scope.save = false;
                return;
            }
            printPDF(newname, newsurname, newagency)
            $scope.newUser = false;
        }

        $scope.statUpdate();
        $scope.baseUrl = "https://" + $location.host() + "/phpmyadmin/sql.php?db=nethcheckin&table=iscritti";

    });