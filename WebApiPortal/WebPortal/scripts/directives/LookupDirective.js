var wiplfiLookupModule = angular.module("LookupDirectiveModule", []);
wiplfiLookupModule.directive("wipfliLookup", [function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            'selectrecord': '&onChangeLookup',
            'lookupAttribute': '=lookupColumn',
            'readOnly': '=readOnly'
        },
        template: "<p class='input-group single-select-lookup'><label class='form-control'>{{lookupAttribute.Name}}</label><span class='input-group-btn'>" +
        "<button type='button' class='btn btn-default' ng-click='selectrecord();' ng-disabled='readOnly'>...</button></span></p>"

    };
}]);