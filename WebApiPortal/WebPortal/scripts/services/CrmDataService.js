CrmDataServiceModule = angular.module('CrmDataServiceModule', [])
    .factory('CrmDataService', function (ODataRetrievalService) {
    var factory = {};
    var recordsCollection = [];
    factory.getCrmData = function (dataDefinitionNode, viewParameters, top) {
        var dataDefinitionType;
        if (dataDefinitionNode != undefined) {
            if (dataDefinitionNode.type != null && dataDefinitionNode.type != undefined)
                dataDefinitionType = dataDefinitionNode.type;
            if (dataDefinitionType !== "" && dataDefinitionType === "FetchXml") {
                var fetchXmlString = dataDefinitionNode.fetchXmlString;
                var opts = {};
                opts.fetchXml = fetchXmlString;
            } else if (dataDefinitionType !== "" && dataDefinitionType === "ODATA") {
                recordsCollection = ODataRetrievalService.getMultipleRecords(dataDefinitionNode, viewParameters, top);
                //return recordsCollection;
            }
        } else {
            console.log("No Data Definition Found for the View Definition " + viewDefinitionNode.viewDefinitionID);
        }
        return recordsCollection;
    };

    factory.getCrmDataByOdataQuery = function (dataDefinition, viewParameters, top, skip) {
        var entityName = '', odataQuery, selectString, filterString = '', expandString, oDataOptionsString = '';
        var filters = new Array();

        if (dataDefinition.odataQuery) {
            entityName = dataDefinition.odataQuery.entity;
        } else {
            console.error(' ODataQuery Node is not there in the DataDefinition ');
        }
        //Reading the select, filter and expand xml nodes if the Query is ODATA.
        selectString = dataDefinition.odataQuery.select ? dataDefinition.odataQuery.select : '';
        //filterString = dataDefinition.odataQuery.filter ? dataDefinition.odataQuery.filter : '';

        if (dataDefinition.odataQuery.filters.filter != null) {
            if (Object.prototype.toString.call(dataDefinition.odataQuery.filters.filter) === '[object Array]') {
                filters = dataDefinition.odataQuery.filters.filter;
            }
            else {
                filters.push(dataDefinition.odataQuery.filters.filter);
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

        expandString = dataDefinition.odataQuery.expand ? dataDefinition.odataQuery.expand : '';

        oDataOptionsString += selectString ? '$select=' + selectString : '';
        oDataOptionsString += filterString ? ' &$filter=' + filterString : '';
        oDataOptionsString += expandString ? ' &$expand=' + expandString : '';

        oDataOptionsString += "&$top=" + top;
        oDataOptionsString += "&$skip=" + skip;


        return ODataRetrievalService.getMultipleRecordsByOdataQuery(entityName, oDataOptionsString);

    };

    factory.UpdateCrmEntity = function (id, entity, type) {
        SDK.REST.updateRecord(id, entity, type, this.updateSuccessCallback, function (message) { alert(message);});
    };

    factory.CreateCrmEntity = function (entity, type, successCallback) {
        SDK.REST.createRecord(entity, type, successCallback, function (message) { alert(message); });
    };

    factory.updateSuccessCallback = function () {
        console.log('Updated');
        alert("Saved");
    };           

    return factory;
});