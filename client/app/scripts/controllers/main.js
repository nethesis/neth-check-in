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
        $scope.ipServer = 'http://192.168.122.82:8080';
        $scope.save = undefined;
        $scope.disabled = true;

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
        });

        document.body.style.zoom = "110%";

        $scope.functionCheckin = function(stato, id, name, surname, agency) {
            $http.get($scope.ipServer + '/printed/' + id).then(function(successData) {

            }, function(errorData) {

            });
            if (agency == undefined) {
                agency = "";
            }

            name = name.charAt(0).toUpperCase() + name.slice(1);
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

            console.log("Agenzia -> " + agency);

            $scope.doc = new jsPDF("h1", "mm", [42, 20]);

            $scope.doc.setFontStyle("bold");
            $scope.doc.setFontSize(18);
            $scope.doc.text(name, 0, 5);
            $scope.doc.text(surname, 0, 12);
            $scope.doc.setFontStyle("italic");
            $scope.doc.setFontSize(13);
            $scope.doc.text(agency, 0, 18);
            $scope.doc.autoPrint();
            $scope.mywindow = window.open($scope.doc.output('bloburl'), '_blank');

        }

        $scope.functionRePrint = function(id) {

            $http.get($scope.ipServer + '/checkin/' + id).then(function(successData) {

            }, function(errorData) {

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

            if (newagency == undefined) {
                newagency = "";
            }

            newname = newname.charAt(0).toUpperCase() + newname.slice(1);
            newsurname = newsurname.charAt(0).toUpperCase() + newsurname.slice(1);
            newagency = newagency.trim();

            if (newname === newname.toUpperCase() && newname.length > 14) {
                newname = newname.substring(0, 14);
            }

            if (newsurname === newsurname.toUpperCase() && newsurname.length > 14) {
                newsurname = newsurname.substring(0, 14);
            }

            if (newagency === newagency.toUpperCase() && newagency.length > 14) {
                newagency = newagency.substring(0, 14);
            }

            if (newagency.length > 17) {
                newagency = newagency.substring(0, 17);
            }

            console.log("Agenzia -> " + newagency);

            $scope.docnew = new jsPDF("h1", "mm", [42, 20]);

            $scope.docnew.setFontStyle("bold");
            $scope.docnew.setFontSize(18);
            $scope.docnew.text(newname, 0, 5);
            $scope.docnew.text(newsurname, 0, 12);
            $scope.docnew.setFontStyle("italic");
            $scope.docnew.setFontSize(13);
            $scope.docnew.text(newagency, 0, 18);
            $scope.docnew.autoPrint();
            $scope.mywindownew = window.open($scope.docnew.output('bloburl'), '_blank');
            $scope.newUser = false;

        }

        $scope.baseUrl = "https://" + $location.host() + "/phpmyadmin/sql.php?db=nethcheckin&table=iscritti";
        document.getElementById("urlPhp").innerHTML = "<a style='display: none; color:#bdbdbd;' target='blank' href='" + $scope.baseUrl + "'>Importa .csv</a>";

    });