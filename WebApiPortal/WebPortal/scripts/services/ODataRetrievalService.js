var ODataRetrievalModule = angular.module('ODataRetrievalModule', []);

ODataRetrievalModule.service('ODataRetrievalService', function () {

    this.getMultipleRecords = function (dataDefinitionNode, viewParameters, top) {
        
        var entityName = '', odataQuery, selectString, filterString = '', expandString, oDataOptionsString = '';
        var filters = new Array();
        //if (parentRecordId == null) parentRecordId = '00000000-0000-0000-0000-000000000000';

        if (dataDefinitionNode.odataQuery) {
            entityName = dataDefinitionNode.odataQuery.entity;
        } else {
            alert(' OData Query Node is not there in the MetaData XML ');
        }
        //Reading the select, filter and expand xml nodes if the Query is ODATA.
        selectString = dataDefinitionNode.odataQuery.select ? dataDefinitionNode.odataQuery.select : '';
        //filterString = dataDefinitionNode.odataQuery.filter ? dataDefinitionNode.odataQuery.filter : '';

        if (dataDefinitionNode.odataQuery.filters.filter != null) {
            if (Object.prototype.toString.call(dataDefinitionNode.odataQuery.filters.filter) === '[object Array]') {
                filters = dataDefinitionNode.odataQuery.filters.filter;
            }
            else {
                filters.push(dataDefinitionNode.odataQuery.filters.filter);
            }
        }


        if (viewParameters != null) {
            for (var f = 0; f < filters.length; f++) {
                if (filters[f].viewParamName == "") {
                    filterString = filterString + " and " + filters[f];
                }
                else {
                    for (var i = 0; i < viewParameters.length; i++) {
                        if (viewParameters[i].name == filters[f].viewParamName) {
                            if (viewParameters[i].value != null && viewParameters[i].value != '') {
                                filterString = filterString + " and " + filters[f].replace('{' + viewParameters[i].name + '}', viewParameters[i].value);
                            }
                        }                        
                    }
                }
            }
        }
        if (filterString != null && filterString.length > 0) {
            filterString = filterString.replace(" and ", "");
        }

        expandString = dataDefinitionNode.odataQuery.expand ? dataDefinitionNode.odataQuery.expand : '';
        expand = expandString;
        oDataOptionsString += selectString ? '$select=' + selectString : '';
        oDataOptionsString += filterString ? ' &$filter=' + filterString : '';
        oDataOptionsString += expandString ? ' &$expand=' + expandString : '';
        oDataOptionsString += top ? ' &$top=' + top : '';
        
        
        if (entityName != "" && oDataOptionsString != "") {
            //SDK.REST.retrieveMultipleRecordsAsync(entityName, oDataOptionsString, retrieveMultipleRecordssuccessCallback, retrieveMultipleRecordserrorCallback, retrieveMultipleRecordsCompleteCallback);
            var recordsCollection = SDK.REST.retrieveMultipleRecords(entityName, oDataOptionsString);
            //$scope.recordsCollection = getFormattedRecords(recordsCollection);
            //$scope.recordsCollection = this.convertToScopeData(recordsCollection, $scope.viewcomposition.viewDefinitions.viewDefinition.columns.column);
            return recordsCollection;
        } else {
            alert("Entity name/options string is blank ");
        }
        return recordsCollection;
    };

    this.getMultipleRecordsByOdataQuery = function (entityName, queryOption) {
        return SDK.REST.retrieveMultipleRecords(entityName, queryOption);
    };
});


