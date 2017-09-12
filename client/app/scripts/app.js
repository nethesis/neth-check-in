'use strict';

/**
 * @ngdoc overview
 * @name nethCheckInApp
 * @description
 * # nethCheckInApp
 *
 * Main module of the application.
 */
 
angular
  .module('nethCheckInApp', [
    'ngRoute',
    'ngSanitize',
    'ngTable'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
