'use strict';

/**
* Simplex Module
*
* @description: Solve Linear Optimization problem by using Simplex Method
* @author: Tran Dinh Trung <trandinhtrung176@gmail.com>
*/
var app = angular.module('Simplex', ['ngRoute']);

app.config(['$routeProvider',
  function($routeProvider) {
  	console.log(1);
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'simplexCtrl'
      })
      .when('/result', {
      	templateUrl: 'views/result.html',
      	controller: 'resultCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);