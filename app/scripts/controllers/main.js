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

    $scope.data = [{
      evento: "NethEvent",
      nome: "Sebastian",
      cognome: "Besel",
      stato: "Check-in eseguito"
    }, {
      evento: "NethEvent",
      nome: "Sebastian",
      cognome: "Besel",
      stato: "Esegui Check-in"
    }, {
      evento: "NethEvent",
      nome: "Sebastian",
      cognome: "Besel",
      stato: "Stampa"
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

    //$scope.isLoading = true;
    //$scope.isError = false;

    //$http.get('http://192.168.5.28:8080/getAllUsers').then(function(successData) {
      // get raw data from server
     // $scope.data = successData.data;

      // hide loader 
      $scope.isLoading = false;
      $scope.isError = false;

      // init table with raw data
      $scope.tableParams = new NgTableParams({
        count: 10
      }, {
        total: $scope.data.length,
        data: $scope.data
      });

    //}, function(errorData) {
     // console.error(errorData);
      //   // hide loader 
     // $scope.isLoading = false;
      // 
      //   // show error message
     // $scope.isError = true;
    //});

    document.body.style.zoom = "110%";

    $scope.functionCheckin = function(stato) {
      if (stato == "Esegui Check-in") {
        console.log("CHECK-IN");
      } else if (stato == "Stampa") {
        console.log("STAMPA");
      }
    }

  });