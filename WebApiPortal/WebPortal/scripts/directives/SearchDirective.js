var searchDirectiveModule = angular.module("SearchDirectiveModule", []);
searchDirectiveModule.directive('wipfliSearch', ['$compile', function ($compile) {
    return {
        restrict: 'E',
        link: function (scope, element, attrs) {
            var refreshParam = {};
            if (scope.viewParameters != null && scope.viewParameters.length > 0) {
                for (var i = 0; i < scope.viewParameters.length; i++)
                    refreshParam[scope.viewParameters[i].name] = scope.data[0];
            }

            var dom = '<div class="col-lg-6">' +
            '<div class="input-group">' +
              '<input type="text" class="form-control" ng-model="data[0]">' +
              '<span class="input-group-btn">' +
                '<button class="btn btn-default" type="button" ng-click="' + scope.refresh(refreshParam) + ';">Search</button>' +
              '</span>' +
            '</div>' +
            '</div>';

            var $e = $compile(dom)(scope);
            element.replaceWith($e);
        }
    };
}]);