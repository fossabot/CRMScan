var wipfliCdataModule = angular.module("WipfliCdataModule", []);
wipfliCdataModule.directive("wipfliCdata", ['MetaDataService', '$compile', function (MetaDataService, $compile) {
    return {
        restrict: 'E',
        replace: true,
        scope:
            {
                columnDef: "=",
                record: "="
            },
        link: function (scope, element, attrs) {
         
            
                
            var xmlText = scope.record[scope.columnDef.dataDefAttr];
            var x2js = new X2JS();            
            var jsonObj = x2js.xml_str2json(xmlText);
            var cData = "";
            var choices = MetaDataService.getArray(jsonObj.stylesheet.template.choose);
            for (var i = 0; i < jsonObj.stylesheet.template.__cdata.length; i++) {
                cData = cData + jsonObj.stylesheet.template.__cdata[i];
                if (choices[i] != null) {
                    cData = cData + "<label style='background-color: yellow;'>" + choices[i].when['value-of']._select + "</label>";
                }
            }
            cData = "<div>" + cData + "</div>"                    
        
            var ctreeDiv = angular.element(cData);
            element.append(ctreeDiv);
            $compile(element.contents())(scope);
        }
    };
}]);