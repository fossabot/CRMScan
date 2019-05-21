
angular.module('MetaDataServiceModule', []).factory('MetaDataService', ['$rootScope',

    function ($rootScope) {
        var factory = {};



        //////***********/////////
        factory.getDataDefinitionsForView = function ($scope, viewDefinition) {
            var returnValue = new Array();
            //var viewDataDefinitionNames = viewDefinition.dataDefinitions.dataDefinition;
            var viewTypes = viewDefinition.viewTypes.viewType;
            var dataDefinitions = $scope.viewcomposition.dataDefinitions.dataDefinition;
            if (viewTypes != null) {
                var dataDef = null;
                if (Object.prototype.toString.call(viewTypes) === '[object Array]') {
                    angular.forEach(viewTypes, function (value, index) {
                        dataDef = factory.getDataDefenitionByName(value.viewData, dataDefinitions);
                        if (dataDef != null)
                            returnValue.push(dataDef);
                    });
                } else {
                    dataDef = factory.getDataDefenitionByName(viewTypes.viewData, dataDefinitions);
                    if (dataDef != null)
                        returnValue.push(dataDef);
                }
            }
            return returnValue;
        };
        factory.getDataDefenitionByName = function (name, dataDefinitions) {
            var dataDef = null;
            if (Object.prototype.toString.call(dataDefinitions) === '[object Array]') {
                for (var i = 0; i < dataDefinitions.length; i++) {
                    if (dataDefinitions[i].name == name) {
                        return dataDefinitions[i];
                    }
                }
            } else {
                if (dataDefinitions.name == name)
                    return dataDefinitions;
            }
            return dataDef;
        };

        factory.getAttributeValue = function (attribute) {

            if (attribute == null) return "";

            if (attribute.__metadata == undefined) {
                return attribute;
            }
            else {
                var type = attribute.__metadata.type;
                if (type.indexOf("EntityReference") > -1)
                    return attribute.Name;
                else if (type.indexOf("Money") > -1) {
                    if (attribute.Value != null)
                        return parseFloat(attribute.Value).toFixed(2);
                }
                else
                    return attribute.Value;
            }
            return "";
        };

        factory.getArray = function (object) {
            var returnArray = new Array();
            if (object != null) {
                if (Object.prototype.toString.call(object) == '[object Array]') {
                    returnArray = object;
                }
                else {
                    returnArray.push(object);
                }
            }
            return returnArray;
        };

        factory.getResponseParameterValue = function (response, parameterName) {
            var parameters = factory.getArray(response.parameters.parameter);
            for (var i = 0; i < parameters.length; i++) {
                if (parameters[i].name === parameterName) {
                    if (parameters[i].value !== "" && parameters[i].value !== undefined) {
                        return parameters[i].value;
                    }
                    else if (parameters[i].location !== "" && parameters[i].location !== undefined) {
                        return getParameterLocationValue(parameters[i].location);
                    }
                    else {
                        return "";
                    }
                }
            }
            return "";
        };

        factory.getPageById = function (pageId) {

            for (var i = 0; i < $rootScope.Pages.length; i++) {
                if ($rootScope.Pages[i].id == pageId) {
                    return $rootScope.Pages[i];
                }
            }

            return null;
        };

        factory.getPageStateByName = function (page, pageStateName) {
            var pageStates = factory.getArray(page.pageState);

            for (var i = 0; i < pageStates.length; i++) {
                if (pageStates[i].id === pageStateName) {
                    return pageStates[i];
                }
            }

            return null;
        };

        return factory;

        function getParameterLocationValue(paramLocation) {
            if ($rootScope.appParameters[paramLocation] !== null && $rootScope.appParameters[paramLocation][0] !== null
                && $rootScope.appParameters[paramLocation][0] !== undefined)
                return $rootScope.appParameters[paramLocation][0];
            else
                return "";
        }
    }
]);
