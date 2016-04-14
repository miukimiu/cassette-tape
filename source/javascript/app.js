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
    'angular-spinkit'
  ])
  .config(function($stateProvider, $urlRouterProvider) {

    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/");

    $stateProvider
    .state('index', {
      url: '/',
      templateUrl: 'views/partial-index.html',
      controller: 'CassetteController',
    });
  })
  .run(['$rootScope', '$state',function($rootScope, $state){

    $rootScope.$on('$stateChangeStart',function(){
        $rootScope.stateIsLoading = true;
        console.log($rootScope.stateIsLoading);
   });


    $rootScope.$on('$stateChangeSuccess',function(){
        $rootScope.stateIsLoading = false;
        console.log($rootScope.stateIsLoading);
   });

  }]);
