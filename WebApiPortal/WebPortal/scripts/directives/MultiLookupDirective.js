var wiplfiLookupModule = angular.module("MultiLookupDirectiveModule", []);
wiplfiLookupModule.directive("wipfliMultiLookup", [function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            'selectrecord': '&onChangeLookup',
            'lookupAttributes': '=lookupColumn'
        },
        template: "<div class='input-group multi-select-lookup'>" +
        "   <label class='form-control'>" +
        "       <span ng-repeat='lookupAttribute in lookupAttributes'>" +
        "           <span class='badge ' >" +
        "               <span class='content'>{{lookupAttribute.Name}}  " +
        "               </span>" +
        "               <span class='link close' ng-click='lookupAttributes.splice(lookupAttributes.indexOf(lookupAttribute),1)'>" +
        "                   <span class='txt-primary glyphicon glyphicon-remove'> </span>" +
        "               </span> " +
        "           </span> " +
        "       </span>" +
        "   </label>" +
        "   <span class='input-group-btn'>" +
        "      <button type='button' class='btn btn-default' ng-click='selectrecord();'>...</button>" +
        "   </span>" +
        "</div>"

    };
}]);