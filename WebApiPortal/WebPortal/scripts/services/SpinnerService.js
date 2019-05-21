var authModule = angular.module("AppSpinnerModule", []);
authModule.factory('appSpinnerService', ['usSpinnerService',
    function (usSpinnerService) {
        var factory = {};
        factory.startSpinner = function (spinnerDivId, spinnerKey) {
            angular.element('#' + spinnerDivId).show();
            usSpinnerService.spin(spinnerKey);
        };
        factory.stopSpinner = function (spinnerDivId, spinnerKey) {
            usSpinnerService.stop(spinnerKey);
            angular.element('#' + spinnerDivId).hide();
        };
        return factory;
    }]);