var homeModule = angular.module("HomeModule", []);
homeModule.controller('HomeController', [
    '$scope',
  '$rootScope',
  function ($scope, $rootScope) {
      $rootScope.isAuthenticated = false;
}]);