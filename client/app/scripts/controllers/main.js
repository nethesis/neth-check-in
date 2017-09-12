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

        $http.get('http://192.168.122.82:8080/iscritti').then(function(successData) {
            // get raw data from server
            $scope.data = successData.data;

            // hide loader 
            $scope.isLoading = false;
            $scope.isError = false;

            $scope.tableParams = new NgTableParams({
                count: 10
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
            $http.get('http://192.168.122.82:8080/iscritti').then(function(successData) {
                // get raw data from server
                $scope.data = successData.data;
                $scope.tableParams = new NgTableParams({
                    count: 10
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
            if (stato == "Partecipante") {

                $http.get('http://192.168.122.82:8080/checkin/' + id).then(function(successData) {

                }, function(errorData) {

                });

            } else if (stato == "Stampa") {

                if (agency == undefined) {
                    agency = "";
                }
                var myWindow = window.open('', '');
                myWindow.document.write('<div style="width:340px;background: white;height:215px;"><div style=" width: 100%; padding-left: 20px; font-weight: 600; margin-top: 68px; font-size: 43px; font-family: sans-serif; ">' + name + '</div><div style=" width: 100%; padding-left: 20px; font-weight: 500; font-size: 27px; font-family: sans-serif; ">' + surname + '</div><div style=" width: 100%; font-family: sans-serif; padding-left: 20px; font-size: 20px; margin-top: 25px; font-weight: 600; ">' + agency + '</div></div>');
                myWindow.document.close();
                myWindow.focus();
                myWindow.print();
                myWindow.close();
                $http.get('http://192.168.122.82:8080/printed/' + id).then(function(successData) {

                }, function(errorData) {

                });

            }
        }

        $scope.functionRePrint = function(id) {

            if (confirm("Verrà ripristinata la stampa per l'utente selezionato") == true) {
                $http.get('http://192.168.122.82:8080/checkin/' + id).then(function(successData) {

                }, function(errorData) {

                });
            } else {
                //Reset print canceled
            }

        }

        $scope.baseUrl = "https://" + $location.host() + "/phpmyadmin/sql.php?db=nethcheckin&table=iscritti";
        document.getElementById("urlPhp").innerHTML="<a style='color:#bdbdbd;' target='blank' href='" + $scope.baseUrl + "'>Importa .csv</a>";
        console.log($scope.baseUrl);
        console.log("SOCKET IS : " + socket);

    });