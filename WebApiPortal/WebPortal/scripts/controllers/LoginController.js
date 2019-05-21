var loginModule = angular.module("LoginModule", ['ngRoute']);
loginModule.controller('LoginController', [
    '$scope',
    '$rootScope',
    '$location',
    'AuthenticationService', '$cookieStore', 'appSpinnerService', 'toaster', '$timeout',
    function ($scope, $rootScope, $location, AuthenticationService, $cookieStore, appSpinnerService, toaster, $timeout) {
        $scope.Email = "";
        $scope.Password = "";
        $scope.Message = "";

        $scope.authenticate = function (form) {
            //$rootScope.isAuthenticated = true;
            //$location.path("/MetaData");
            form.$submitted = true;
            if (form.$valid) {
                appSpinnerService.startSpinner('spinner-1', 'spinner-1');
                var promise = AuthenticationService.Authenticate($scope.Email, $scope.Password);
                promise.then(function (apiDataResponse) {
                    if (apiDataResponse == null) {
                        $rootScope.isAuthenticated = false;
                        $scope.Message = "Incorrect Username or Password";
                    } else {
                        $rootScope.isAuthenticated = true;
                        $scope.Message = "";
                        $cookieStore.put("logged-in-user", apiDataResponse);
                        $rootScope.LoggedInUserId = apiDataResponse.Attributes[0].Value;
                        $rootScope.LoggedInUserName = apiDataResponse.Attributes[1].Value;
                        $location.path("/MetaData");
                    }
                    appSpinnerService.stopSpinner('spinner-1', 'spinner-1');
                    //apiDataResponse
                }, function (apiDataResponse) {
                    appSpinnerService.stopSpinner('spinner-1', 'spinner-1');
                    toaster.error('', 'Server Error!');
                    console.log("Error while signing in " + apiDataResponse);
                    $rootScope.isAuthenticated = false;
                    $location.path("/Login");
                });
            }

        }
        $timeout(function () {
            window.scrollTo(0, 1);
        }, 0);
    }]);