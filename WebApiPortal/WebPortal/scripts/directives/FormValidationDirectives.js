var formValidationDirectiveModule = angular.module("FormValidationDirectiveModule", []);
formValidationDirectiveModule.directive("hasError", ['$compile', function ($compile) {
    return {
        priority: 1001,
        terminal: true,
        restrict: 'A',
        link: function (scope, el) {
            el.removeAttr('has-error');
            el.attr('ng-class', "((entityForm[column.dataDefAttr].$dirty==true || entityForm.$submitted) && entityForm[column.dataDefAttr].$invalid==true) && 'has-error'");
            $compile(el)(scope);
        }

    };
}]);
formValidationDirectiveModule.directive("errorMessages", [function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            'form': '=',
            'variable': '=',
            'displayName': '=',
            'onlyOnSubmit': '='

        },
        template: '<div ng-show="((!onlyOnSubmit && form[variable].$dirty) || form.$submitted) && form[variable].$invalid"  ' +
        'ng-messages="form[variable].$error" ' +
        'class="alert alert-danger" ' +
        'role="alert"> ' +
        '<span class="sr-only">Error:</span>' +
        '<div ng-message="required">{{displayName}} is required</div>' +
        '<div ng-message="minlength">{{displayName}} is too short</div>' +
        '<div ng-message="maxlength">{{displayName}} is too long</div>' +
        '<div ng-message="email">{{displayName}} is invalid</div>' +
        '</div>'

    };
}]);