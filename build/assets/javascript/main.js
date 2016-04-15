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
    'ui.router'
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

    $rootScope.$on('$stateChangeSuccess',function(){
      console.log('rootScope yoo');
      angular.element(document.querySelector('#wave-spinner')).remove();
    });

  }]);

/**
 * @ngdoc function
 * @name cassetteApp.controller:CassetteController
 * @description
 * # CassetteController
 * Controller of the cassetteApp
 */

angular.module('cassetteApp')
.controller('CassetteController', function($scope, $window, $location, $http, $anchorScroll) {


});


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNhc3NldHRlQ29udHJvbGxlci5qcyIsIm1haW4tcmVjb3JkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuZ2RvYyBvdmVydmlld1xuICogQG5hbWUgY2Fzc2V0dGVBcHBcbiAqIEBkZXNjcmlwdGlvblxuICogIyBjYXNzZXR0ZUFwcFxuICpcbiAqIE1haW4gbW9kdWxlIG9mIHRoZSBhcHBsaWNhdGlvbi5cbiAqL1xuXG4gYW5ndWxhclxuICAubW9kdWxlKCdjYXNzZXR0ZUFwcCcsIFtcbiAgICAndWkucm91dGVyJ1xuICBdKVxuICAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuICAgIC8vIEZvciBhbnkgdW5tYXRjaGVkIHVybCwgcmVkaXJlY3QgdG8gL3N0YXRlMVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCIvXCIpO1xuXG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2luZGV4Jywge1xuICAgICAgdXJsOiAnLycsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL3BhcnRpYWwtaW5kZXguaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnQ2Fzc2V0dGVDb250cm9sbGVyJyxcbiAgICB9KTtcbiAgfSlcbiAgLnJ1bihbJyRyb290U2NvcGUnLCAnJHN0YXRlJyxmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGUpe1xuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLGZ1bmN0aW9uKCl7XG4gICAgICBjb25zb2xlLmxvZygncm9vdFNjb3BlIHlvbycpO1xuICAgICAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN3YXZlLXNwaW5uZXInKSkucmVtb3ZlKCk7XG4gICAgfSk7XG5cbiAgfV0pO1xuIiwiLyoqXG4gKiBAbmdkb2MgZnVuY3Rpb25cbiAqIEBuYW1lIGNhc3NldHRlQXBwLmNvbnRyb2xsZXI6Q2Fzc2V0dGVDb250cm9sbGVyXG4gKiBAZGVzY3JpcHRpb25cbiAqICMgQ2Fzc2V0dGVDb250cm9sbGVyXG4gKiBDb250cm9sbGVyIG9mIHRoZSBjYXNzZXR0ZUFwcFxuICovXG5cbmFuZ3VsYXIubW9kdWxlKCdjYXNzZXR0ZUFwcCcpXG4uY29udHJvbGxlcignQ2Fzc2V0dGVDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkd2luZG93LCAkbG9jYXRpb24sICRodHRwLCAkYW5jaG9yU2Nyb2xsKSB7XG5cblxufSk7XG4iLCIiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=