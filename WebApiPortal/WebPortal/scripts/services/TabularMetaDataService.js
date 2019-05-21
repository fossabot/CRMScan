angular.module('TabularMetaDataServiceModule', []).factory('TabularMetaDataService', function () {
    var factory = {};
    var columnModel, columnNames;
    var metaData = {};
    factory.getMetaDataForTabularView = function ($scope, viewDefinition) {
        var columnsOfGrid = viewDefinition.columns;
        var rowNumOfJqGrid = viewDefinition.rowNum;
        var rowListOfJqGrid = viewDefinition.rowList;
        var captionOfjQGrid = viewDefinition.caption;
        var datatypeOfjQGrid = viewDefinition.datatype;
        var gridTableId = viewDefinition.tableId;
        var pagerId = viewDefinition.pagerId;
        var dataDefinitionForView = viewDefinition.dataDefinition;
        columnModel = new Array();
        //Column Model for jQGrid
        columnNames = new Array();
        //Column Names for jQGrid
        //Building the colModel and colNames dynamically..
        $.each(columnsOfGrid, function (index, value) {
            var columnNode = value;
            columnModel.push({
                name: columnNode.dataDefAttr,
                index: columnNode.dataDefAttr,
                width: columnNode.width,
                hidden: columnNode.hidden
            });
            columnNames.push(columnNode.DisplayName);
        });
        metaData.datatype = datatypeOfjQGrid;
        metaData.height = 'auto';
        metaData.shrinkToFit = true;
        metaData.tableId = gridTableId;
        metaData.autowidth = true;
        metaData.pager = $('#' + pagerId);
        metaData.rowNum = rowNumOfJqGrid;
        metaData.rowList = rowListOfJqGrid;
        metaData.viewrecords = true;
        metaData.colNames = columnNames;
        metaData.colModel = columnModel;
        metaData.caption = captionOfjQGrid;
        metaData.subGrid = true;
        metaData.subGridOptions = {
            'plusicon': 'ui-icon-triangle-1-e',
            'minusicon': 'ui-icon-triangle-1-s',
            'openicon': 'ui-icon-arrowreturn-1-e',
            'expandOnLoad': false
        };
        metaData.subGridRowExpanded = function (subgridId, rowId) {
            $scope.onSubGridRowExpanded(subgridId, rowId);
        };
        return metaData;
    };
    return factory;
});