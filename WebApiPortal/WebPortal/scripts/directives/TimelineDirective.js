var timeLineDirectiveModule = angular.module("TimeLineDirectiveModule", []);
var data;
timeLineDirectiveModule.directive('wipfliTimeline', ['ImageService', 'MetaDataService', function (ImageService, MetaDataService) {
    return {
        restrict: 'E',
        link: function (scope, element, attrs) {
            var timelineDiv, pager;
            var dataTable;
            var timeline;
            var options, table;
            options = {
                "width": "100%",
                "height": "99%",
                "style": "box" // optional
            };
            var configForViewDefinition = MetaDataService.getMetaDataForDirective(scope, scope.viewNode, scope.viewcomposition);
            var divElement = "<div id='" + configForViewDefinition.timeLineId + "'></div>";
            //var tableElement = "<table id='" + configForViewDefinition.tableId + "'><tr><td>"+divElement+"</td></tr></table>";
            //table = angular.element(tableElement);
            //element.append(table);
            timelineDiv = angular.element(divElement);
            element.append(timelineDiv);
            dataTable = new google.visualization.DataTable();
            dataTable.addColumn('datetime', 'start');
            dataTable.addColumn('datetime', 'end');
            dataTable.addColumn('string', 'content');
            timeline = new links.Timeline(document.getElementById(configForViewDefinition.timeLineId));
            var i;
            var plots = configForViewDefinition.plots;
            for (var j = 0; j < plots[0].length ; j++) {
                var dataDefForSeries = plots[0][j].dataDef;
                console.log("DataDefinition is " + dataDefForSeries);
                var dataHash = scope.data;
                $.each(dataHash, function (index, value) {
                    var seriesRecords;
                    if (value.dataDefinition == dataDefForSeries)
                        seriesRecords = value.records;
                    if (seriesRecords != null && seriesRecords.length > 0) {
                        for (i = 0; i < seriesRecords.length; i++) {
                            var startDateFormatted = "";
                            var endDateFormatted = "";
                            var startDateAttribute = plots[0][j].startdate;
                            var endDateAttribute = plots[0][j].enddate;
                            var textAttribute = plots[0][j].description;
                            var imageAttribute = plots[0][j].imageAttribute;
                            var cssClassAttribute = plots[0][j].cssClass;
                            var startDate = seriesRecords[i][startDateAttribute];
                            var endDate = seriesRecords[i][endDateAttribute];
                            var text = seriesRecords[i][textAttribute];
                            var imageAttributeValue = seriesRecords[i][imageAttribute];
                            var imageSrc = ImageService.getImagePath(imageAttributeValue, imageAttribute);
                            if (startDate != null)
                                startDateFormatted = new Date(startDate);
                            if (endDate != null)
                                endDateFormatted = new Date(endDate);
                            if (imageAttribute == null)
                                imageSrc = plots[0][j].image;
                            if (startDateFormatted != "" && endDateFormatted != "")
                                dataTable.addRows([
                                    [startDateFormatted, endDateFormatted, '<img src="' + imageSrc + '"/><span class="' + cssClassAttribute + '">' + text + '</span>']
                                ]);

                            else if (startDateFormatted != "" && endDateFormatted == "")
                                dataTable.addRows([
                                [startDateFormatted, , '<img src="' + imageSrc + '"/><span class="' + cssClassAttribute + '">' + text + '</span>']
                                ]);
                        }
                    }
                });
                timeline.draw(dataTable, options);
            }
        }
    };
}]);

