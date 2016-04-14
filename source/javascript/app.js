'use strict';

/**
 * @ngdoc overview
 * @name cassetteApp
 * @description
 * # cassetteApp
 *
 * Main module of the application.
 */
 angular
  .module('cassetteApp', [
    'ui.router',
    'smoothScroll'
  ])
  .config(function($stateProvider, $urlRouterProvider) {
  //
    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/");

    $stateProvider
    .state('index', {
      url: '/',
      templateUrl: 'views/partial-index.html',
      controller: 'CassetteController',
    });
  });
