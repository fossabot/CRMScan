var wipfliHtmlModule = angular.module("WipfliHtmlModule", []);
wipfliHtmlModule.directive("wipfliHtml", ['$compile',function ($compile) {
    return {
        restrict: 'E',
        replace: true,
        scope:
            {
                columnDef: "=",
                record: "="
            },
        link: function (scope, element, attrs) {
            var htmlText = scope.record[scope.columnDef.dataDefAttr];                              

            var ctreeDiv = angular.element(htmlText);
            element.append(ctreeDiv);
            $compile(element.contents())(scope);
        }
    };
}]);