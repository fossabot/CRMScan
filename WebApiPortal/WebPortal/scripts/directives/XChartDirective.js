var chartDirectiveModule = angular.module('ChartDirecitiveModule', []);
chartDirectiveModule.directive('wipfliChart', ['ImageService', 'MetaDataService', function (ImageService, MetaDataService) {
           var graphIdCount = 0;
        return {
            restrict: 'EACM',
            template: '<figure></figure>',
            replace: true,

            link: function (scope, element, attrs) {
                var elemId;
                if (!(elemId = element.attr('id'))) {
                    graphIdCount++;
                    elemId = 'graph-' + graphIdCount;
                    element.attr('id', elemId);
                }

                var chartType = scope.viewDefinition.chartType;
                var chart = null;
                var recordData =[];              
                   for (var i = 0; i < scope.data[0].records.length; i++) {
                       recordData.push({
                             "x": scope.data[0].records[i].Name,
                             "y": parseInt(scope.data[0].records[i].EstimatedValue.Value)
                        });
                    }
                   var chartData = {
                       "xScale": "ordinal",
                       "yScale": "linear",
                       "main": [
                           {
                               "className": "Opportunity",
                               "data": recordData
                           }]
                   };
           
                   chart = new xChart(chartType, chartData, '#' + elemId);
           
               
                    
             /*   scope.$watch(attrs.data, function (v) {
                    if (!chart) {
                        chart = new xChart(scope.$eval(attrs.type), v, '#' + elemId, scope.$eval(attrs.opts));
                    } else {
                        chart.setData(v);
                    }
                }, true);*/
          
            }
        };
    }]);


    