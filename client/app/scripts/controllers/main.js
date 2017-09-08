'use strict';

/**
 * @ngdoc function
 * @name nethCheckInApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the nethCheckInApp
 */
angular.module('nethCheckInApp')
    .controller('MainCtrl', function($scope, $filter, $http, NgTableParams) {

        /*    $scope.data = [{
              evento: "NethEvent",
              nome: "Sebastian",
              cognome: "Besel",
              stato: "Check-in eseguito"
            }, {
              evento: "NethEvent",
              nome: "Sebastian",
              cognome: "Besel",
              stato: "Check-in eseguito"
            }, {
              evento: "NethEvent",
              nome: "Sebastian",
              cognome: "Besel",
              stato: "Check-in eseguito"
            }, {
              evento: "NethEvent",
              nome: "Sebastian",
              cognome: "Besel",
              stato: "Check-in eseguito"
            }, {
              evento: "NethEvent",
              nome: "Sebastian",
              cognome: "Besel",
              stato: "Check-in eseguito"
            }, {
              evento: "NethEvent",
              nome: "Sebastian",
              cognome: "Besel",
              stato: "Check-in eseguito"
            }, {
              evento: "NethEvent",
              nome: "Sebastian",
              cognome: "Besel",
              stato: "Check-in eseguito"
            }];
        */
        $scope.isLoading = true;
        $scope.isError = false;


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

        // init table with raw data
        setInterval(function() {

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

        }, 5000);

        document.body.style.zoom = "110%";

        $scope.functionCheckin = function(stato, id) {
            if (stato == "Esegui Check-in") {
                console.log("CHECK-IN -> " + id);

                $http.get('http://192.168.122.82:8080/checkin/' + id).then(function(successData) {

                }, function(errorData) {

                });

            } else if (stato == "Stampa") {
                console.log("STAMPA  - " + id);

            }
        }

    });