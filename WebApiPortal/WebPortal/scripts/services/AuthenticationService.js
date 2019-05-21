var authModule = angular.module("AuthenticaionModule", []);
authModule.factory('AuthenticationService', ['$http', 'AppConfig',
    function ($http, AppConfig) {
        var factory = {};
        factory.Authenticate = function (userName, password) {
            //TOD: call authenticate and return true or false

            var d = $.Deferred();
            $http({
                method: 'POST',
                url: AppConfig.URL_WEB_API + '/api/Authentication/Authenticate',
                data: {
                    "username": userName,
                    "password": password
                }
            }).success(function (data, status, headers, config) {
                d.resolve(data.Data);
            }).error(function (data, status, headers, config) {
                d.reject(data);
            });

            return d;
        };
        return factory;
    }]);