var wipfliBinaryImageModule = angular.module("WipfliBinaryImageModule", []);
wipfliBinaryImageModule.directive("wipfliBinaryImage", ['MetaDataService', '$compile', '$modal', function (MetaDataService, $compile, $modal) {
    return {      
        restrict: 'E',
        replace: true,
        scope:
            {
                columnDef: "=",
                record: "=",
                getBinaryImage: '&onClick'
            },
        
        link: function (scope, element, attrs) {

            var promise = scope.getBinaryImage();
            promise.then(function (response) {

                    scope.Image = response;
            }, function (response) {
                console.log("Error in binaryData directive!");
                console.log(response);
            });
            
             var ctreeDiv = angular.element("<img src='data:image/png;base64,{{Image}}' />");            
            element.append(ctreeDiv);
            $compile(element.contents())(scope);
            
            
        },

        
    };
    
}]);

