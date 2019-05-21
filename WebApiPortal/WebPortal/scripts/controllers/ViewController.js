var viewControllerModule = angular.module('viewModule', []);
viewControllerModule.controller('ViewController', [
    '$scope',
    '$rootScope',
    '$compile',
    '$timeout',
    'MetaDataService',
    'CrmDataService',
    'PortalApiService',
    '$modal',
    '$location',
    'appSpinnerService',
    'toaster',
    '$window',
    function ($scope, $rootScope, $compile, $timeout, MetaDataService, CrmDataService, PortalApiService, $modal, $location,
              appSpinnerService, toaster,  $window) {
        if ($rootScope.isAuthenticated == false) {
            $location.path("/Login");
        }

        if ($scope.viewDefinition == null) {
            $scope.viewDefinition = $rootScope.currentLookupView;
        }
        var isPortal = false;
        if (ConfigName == null)
            isPortal = true;

        var viewDefNode = $scope.viewDefinition;
        $scope.viewDefinitionId = viewDefNode.viewDefinitionID;
        $scope.recordCount = 50;
        if ($scope.viewDefinition.recordCount != null || $scope.viewDefinition.recordCount > 0)
            $scope.recordCount = $scope.viewDefinition.recordCount;
        $scope.currentPage = 1;
        $scope.data = new Array();
        $scope.dataDefinitions = MetaDataService.getDataDefinitionsForView($scope, viewDefNode);
        $scope.viewParameters = setRootParamValue($scope.viewDefinition.viewParameters);

        restoreParamsFromViewDefinition();

        $scope.actions = [];
        if (viewDefNode.viewTypes.viewType.actions != null) {
            $scope.actions = MetaDataService.getArray(viewDefNode.viewTypes.viewType.actions.action);
        }
        if ($scope.viewDefinition.viewTypes.viewType.columns.column != null) {
            $scope.viewDefinition.viewTypes.viewType.columns.column = MetaDataService.getArray($scope.viewDefinition.viewTypes.viewType.columns.column);
        }

        var viewTypes = MetaDataService.getArray($scope.viewDefinition.viewTypes.viewType);
        $scope.selectedViewType = viewTypes[0];
        if ($scope.selectedViewType.navButtons != null) {
            $scope.navButtons = MetaDataService.getArray($scope.selectedViewType.navButtons.navButton);
        }
        //EVENT BEFORE VIEW LOAD
        triggerViewLoadEvent();

        //GET DATA
        if ($scope.dataDefinitions.length == 0) {
            $scope.data = getcreateEnityTemplate();
        }

        else {
            $scope.data = getDataForView($scope.dataDefinitions);
        }

        $scope.onSubViewExpanded = function (id) {
            var subViews = $scope.viewDefinition.subViewDefinitions;
            if (subViews != null && subViews.viewDefinition != null) {
                //for (var i = 0; i < subViews.length; i++) {
                $scope.viewDefinition = subViews.viewDefinition;
                $('#' + id).append($compile('<ng-include ng-controller="ViewController" src="viewDefinition.templateUrl" id="{{viewDefinition.templateUrl}}"></ng-include>')($scope));  //}
            }

        };

        $scope.clearNonRootSearchParams = function (viewParameters) {
            var viewParams = MetaDataService.getArray(viewParameters.viewParameter);
            for (var i = 0; i < viewParams.length; i++) {
                if (viewParams[i] && viewParams[i].isRoot && viewParams[i].isRoot == 'false' &&
                    (viewParams[i].useDefaultValue == undefined || viewParams[i].useDefaultValue == "false")) {
                    viewParams[i].value = null;
                }
            }

        };

        $scope.openPopup = function (parameters, scopeData) {
            var templateDef = parameters;
            //var templateViewParams = MetaDataService.getArray(templateDef.viewParameter)
            var popupViewDef = getViewDefinitionById($rootScope.viewDefinitions, parameters.viewDefinitionId);
            var popupVParams = MetaDataService.getArray(popupViewDef.viewParameters.viewParameter)

            for (var i = 0; i < popupVParams.length; i++) {
                if (popupVParams[i].name == templateDef.viewParameter.name) {
                    if (popupVParams[i].isRoot == 'true') {
                        $scope.SelectedRecordId = scopeData[templateDef.viewParameter.attribute].Id;
                    }
                }
            }

            $scope.openLookup(parameters);
        }

        $scope.openLookup = function (lookupColumnDefinition) {
            var viewDef = getViewDefinitionById($rootScope.viewDefinitions, lookupColumnDefinition.viewDefinitionId);
            $rootScope.currentLookupView = viewDef;
            $scope.recordCount = 15;
            $scope.currentPage = 1;
            $scope.HasMoreRecords = false;
            if (viewDef.recordCount != null || viewDef.recordCount > 0)
                $scope.recordCount = viewDef.recordCount;

            //var lookupTemplate = "wipfli_Lookup.htm";
            //if (ConfigName == null)
            //    lookupTemplate = "/views/Lookup.htm";
            var lookupTemplate = lookupColumnDefinition.lookupTemplate;
            var modalObject = {
                templateUrl: lookupTemplate,
                controller: 'ModalInstanceCtrl',
                resolve: {
                    passThru: function () {
                        return {
                            initialise: function () {
                                $scope.clearNonRootSearchParams(viewDef.viewParameters);
                                $scope.initAppParameters(viewDef.viewParameters);
                            },
                            data: function () {
                                return getDataForViewAsync($scope, MetaDataService.getDataDefinitionsForView($scope, viewDef), viewDef);
                            },
                            nextPageData: function () {
                                $scope.currentPage++;
                                return getDataForViewAsync($scope, MetaDataService.getDataDefinitionsForView($scope, viewDef), viewDef);
                            },
                            previousPageData: function () {
                                $scope.currentPage--;
                                return getDataForViewAsync($scope, MetaDataService.getDataDefinitionsForView($scope, viewDef), viewDef);
                            },
                            columnDefinition: function () {
                                return viewDef.viewTypes.viewType.columns.column;
                            },
                            lookupcolumn: function () {
                                return lookupColumnDefinition;
                            },
                            title: function () {
                                return viewDef.title;
                            },
                            onOk: function ($modalInstance, selectedItem, lookupColumn) {
                                return $modalInstance.close({item: selectedItem, column: lookupColumn});
                            },
                            hasMoreRecords: function () {
                                return $scope.HasMoreRecords;
                            },
                            getCurrentPage: function () {
                                return $scope.currentPage;
                            }
                        }
                    }

                }
                // windowClass: 'app-modal-window'

            };

            var modalInstance = $modal.open(modalObject);
            // $scope.modalInstance = modalInstance;


            modalInstance.result.then(function (selectedItem) {
                var column = selectedItem.column;
                if (selectedItem.item != null) {
                    var item = selectedItem.item;


                    if ($scope.data[0].records) {
                        $scope.updateLookupRecord($scope.data[0].records[0], column, item);
                    } else {
                        $scope.updateLookupRecord($scope.data[0], column, item);
                    }
                } else {
                    if ($scope.data[0].records) {
                        $scope.updateLookupRecord($scope.data[0].records[0], column, null);
                    } else {
                        $scope.updateLookupRecord($scope.data[0], column, null);
                    }
                }

            }, function () {
                //$log.info('Modal dismissed at: ' + new Date
                console.log('Modal dismissed at: ' + new Date());
            });
        };

        $scope.updateLookupRecord = function (record, column, source) {
            if (source != null) {
                var attr = record[column.dataDefAttr];
                if (typeof attr !== Object) {
                    attr = record[column.dataDefAttr] = {
                        LogicalName: column.entityLogicalName
                    };
                }
                attr.Id = source[column.primaryId];
                attr.Name = source[column.primaryName];
            } else {
                record[column.dataDefAttr] = null;
            }
        }


        $scope.openMultiLookup = function (lookupColumnDefinition) {
            var viewDef = getViewDefinitionById($rootScope.viewDefinitions, lookupColumnDefinition.viewDefinitionId);
            $rootScope.currentLookupView = viewDef;
            $scope.recordCount = 15;
            $scope.currentPage = 1;
            $scope.HasMoreRecords = false;
            if (viewDef.recordCount != null || viewDef.recordCount > 0)
                $scope.recordCount = viewDef.recordCount;
            var lookupTemplate = "wipfli_Lookup.htm";
            if (ConfigName == null)
                lookupTemplate = "/views/MultiLookup.htm";

            var modalObject = {
                templateUrl: lookupTemplate,
                controller: 'ModalInstanceCtrl',
                resolve: {
                    passThru: function () {
                        return {
                            initialise: function () {
                                $scope.clearNonRootSearchParams(viewDef.viewParameters);
                                $scope.initAppParameters(viewDef.viewParameters);
                            },
                            data: function () {
                                return getDataForViewAsync($scope, MetaDataService.getDataDefinitionsForView($scope, viewDef), viewDef);
                            },
                            nextPageData: function () {
                                $scope.currentPage++;
                                return getDataForViewAsync($scope, MetaDataService.getDataDefinitionsForView($scope, viewDef), viewDef);
                            },
                            previousPageData: function () {
                                $scope.currentPage--;
                                return getDataForViewAsync($scope, MetaDataService.getDataDefinitionsForView($scope, viewDef), viewDef);
                            },
                            columnDefinition: function () {
                                return viewDef.viewTypes.viewType.columns.column;
                            },
                            lookupcolumn: function () {
                                return lookupColumnDefinition;
                            },
                            title: function () {
                                return viewDef.title;
                            },
                            onOk: function ($modalInstance, selectedItems, lookupColumn, data) {
                                var multiSelectedItems = new Array();
                                if (data && data.length) {
                                    angular.forEach(data[0].records, function (record, index) {
                                        if (record.selected == true) {
                                            multiSelectedItems.push(record);
                                        }
                                    });
                                }
                                return $modalInstance.close({item: multiSelectedItems, column: lookupColumn});
                            },
                            hasMoreRecords: function () {
                                return $scope.HasMoreRecords;
                            },
                            getCurrentPage: function () {
                                return $scope.currentPage;
                            }
                        }
                    }

                }
                // windowClass: 'app-modal-window'

            };

            var modalInstance = $modal.open(modalObject);
            // $scope.modalInstance = modalInstance;


            modalInstance.result.then(function (result) {
                if ($scope.data[0].records) {
                    $scope.updateMultiLookupRecords($scope.data[0].records[0], result.column, result.item);
                } else {
                    $scope.updateMultiLookupRecords($scope.data[0], result.column, result.item);
                }

            }, function () {
                //$log.info('Modal dismissed at: ' + new Date
                console.log('Modal dismissed at: ' + new Date());
            });
        };


        $scope.updateMultiLookupRecords = function (record, column, selectedItems) {

            var attr = record[column.dataDefAttr];
            if (!attr || !attr.length) {
                attr = record[column.dataDefAttr] = new Array();
            }
            angular.forEach(selectedItems, function (item, index) {
                var exists = false;
                for (var i = 0; i < attr.length; i++) {
                    if (attr[i].Id == item[column.primaryId]) {
                        exists = true;
                        break;
                    }
                }

                if (exists == false) {
                    attr.push({
                        Id: item[column.primaryId],
                        LogicalName: column.entityLogicalName,
                        Name: item[column.primaryName]
                    });
                }
            });

        }
        $scope.refresh = function (arguments, parameterName) {
            console.log('on Select: ' + arguments);
            var refreshParam = {};
            if (parameterName == null) {
                if ($scope.viewParameters != null && $scope.viewParameters.length > 0) {
                    for (var i = 0; i < $scope.viewParameters.length; i++) {
                        $scope.viewParameters[i].value = arguments[$scope.viewParameters[i].name];
                        refreshParam[$scope.viewParameters[i].name] = arguments[$scope.viewParameters[i].name];
                    }
                }
            }
            else {
                refreshParam[parameterName] = arguments;
            }

            $rootScope.$broadcast("refresh", {viewParameters: refreshParam, sourceView: $scope.viewDefinitionId});
        };

        $scope.$on("refresh", function (event, args) {
            console.log("$on: " + args);

            if ($scope.viewDefinitionId != args.sourceView) {//Do not refresh source view
                if ($scope.viewDefinition.viewState != "Create") {

                    var viewParams = MetaDataService.getArray($scope.viewParameters);
                    var broadcastViewParams = args.viewParameters;
                    //If broadcast contains the parameter and values are different
                    if (viewParams != null) {
                        $scope.viewParameters = viewParams;

                      //  if (Object.prototype.toString.call(viewParams) === '[object Array]') {
                            for (var i = 0; i < viewParams.length; i++) {
                               // if (broadcastViewParams[viewParams[i].name] != null && broadcastViewParams[viewParams[i].name] != viewParams[i].value) {
                                    viewParams[i].value = broadcastViewParams[viewParams[i].name];
                                    if (ConfigName == null) {
                                        var promiseOfPortalApiService;
                                        appSpinnerService.startSpinner('app-spinner', 'app-spinner');
                                        promiseOfPortalApiService = PortalApiService.getDataFromApiController($scope, $scope.dataDefinitions[0], $scope.viewParameters, $scope.recordCount, $scope.currentPage);
                                        promiseOfPortalApiService.then(function (apiDataResponse) {
                                            $scope.data[0] = {'records': apiDataResponse};
                                            appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                                            // removed for MTCCA-151 toaster.success('', 'Done!');
                                        }, function (apiDataResponse) {
                                            appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                                            toaster.error('Server Error!');
                                            console.log("Error Occured in refresh method " + apiDataResponse);
                                        });

                                    } else {
                                        var response = CrmDataService.getCrmData($scope.dataDefinitions[0], $scope.viewParameters);
                                        var records = response.results;
                                        $scope.data[0] = {"records": records};
                                    }

                                    break;
                               // }
                            }
                     //   }
                        
                    }
                }
            }

        });

        $scope.SaveCrmRecord = function (form, record) {
            //if (Object.prototype.toString.call($scope.viewDefinition.viewTypes.viewType) === '[object Array]') {
            //    //TODO:
            //}
            //else{
            //    var columns = $scope.viewDefinition.viewTypes.viewType.columns.column;
            //    var entity = new Object();
            //    angular.forEach(columns, function (value, index) {
            //        entity[value.dataDefAttr] = record[value.dataDefAttr];

            //    });
            //}

            form.$submitted = true;
            if (form.$valid) {
                if (ConfigName == null) {
                    appSpinnerService.startSpinner('app-spinner', 'app-spinner');
                    PortalApiService.UpdateCrmEntityFromPortal(record[$scope.viewDefinition.viewTypes.viewType.idAttribute], record, $scope.viewDefinition.viewTypes.viewType.entitySchemaName, $scope.viewDefinition.viewTypes.viewType.columns.column).then(function () {
                        $rootScope.$broadcast('afteredit', $scope.viewDefinition, record[$scope.viewDefinition.viewTypes.viewType.idAttribute]);
                        appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                        toaster.success('', 'Done!');
                    }, function (apiDataResponse) {
                        appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                        toaster.error('', 'Server Error!');
                        console.log("Error while saving data " + apiDataResponse);
                    });
                } else {
                    CrmDataService.UpdateCrmEntity(record[$scope.viewDefinition.viewTypes.viewType.idAttribute], record, $scope.viewDefinition.viewTypes.viewType.entitySchemaName);
                }
            }
        };

        $scope.CreateCrmRecord = function (form, record) {
            form.$submitted = true;
            if (form.$valid) {
                if (ConfigName == null) {
                    appSpinnerService.startSpinner('app-spinner', 'app-spinner');
                    var promiseFromCreateCrmEntityFromPortal = PortalApiService.CreateCrmEntityFromPortal(record, $scope.viewDefinition.viewTypes.viewType.entitySchemaName, $scope.viewDefinition.viewTypes.viewType.columns.column);
                    promiseFromCreateCrmEntityFromPortal.then(function (recordCreated) {
                        console.log("created");
                        if ($scope.viewDefinition.outputParameter != null && $scope.viewDefinition.outputParameter != '') {
                            $rootScope.appParameters[$scope.viewDefinition.outputParameter] = [recordCreated];
                        }
                        if ($scope.viewDefinition.afterCreate != null) {
                            if ($scope.viewDefinition.afterCreate.navigateTo != null) {
                                $scope.navigateTo($scope.viewDefinition.afterCreate.navigateTo.pageState, $scope.SelectedRecordId);
                            }else if ($scope.viewDefinition.afterCreate.broadcast != null) {
                                $rootScope.$broadcast('aftercreate', null);
                            }
                            else {
                                $window.location.reload();
                            }
                        }
                        
                        
                        appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                        toaster.success('', 'Done!');
                    }, function (apiDataResponse) {
                        appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                        //toaster.error('', 'Server Error!');
                        console.log("In error callback " + apiDataResponse);
                        if ($scope.viewDefinition.outputParameter != null && $scope.viewDefinition.outputParameter != '') {
                            $rootScope.appParameters[$scope.viewDefinition.outputParameter] = [apiDataResponse];
                        }
                        var events = MetaDataService.getArray($scope.selectedViewType.events.event);
                        for (var ei = 0; ei < events.length; ei++) {
                            if (events[ei].type == "create_failed") {                           
                                
                                $rootScope.eventHandler(events[ei].name, $scope.selectedViewType);
                                
                                break;
                            }
                        }
                    });
                } else {
                    CrmDataService.CreateCrmEntity(record, $scope.viewDefinition.viewTypes.viewType.entitySchemaName, createEntityCallback);
                }
            }
        };

        $scope.loadNextPage = function () {
            $rootScope.loadNextPageContent($scope, ConfigName, PortalApiService, CrmDataService);
        }

        $scope.loadPreviousPage = function () {
            $rootScope.loadPreviousPageContent($scope, ConfigName, PortalApiService, CrmDataService);
        }

        $scope.getAttributeValue = function (attribute) {
            return MetaDataService.getAttributeValue(attribute);
        };

        $scope.eval = function (exp) {
            var value = $scope.$eval(exp);
            return value;
        };

        $scope.getScope = function () {
            return $scope;
        }

        function createEntityCallback(recordCreated) {
            $scope.data = getcreateEnityTemplate();
            //alert('Created');
            //$rootScope.$broadcast("refresh", { recordCreated: recordCreated, dependantView: $scope.viewDefinition.dependantviews });
            $scope.refresh(recordCreated);

        };

        function getcreateEnityTemplate() {
            var returnObj = new Array();
            var createEnityTemplate = new Object();
            if (Object.prototype.toString.call($scope.viewDefinition.viewTypes.viewType) === '[object Array]') {
                //TODO:
            }
            else {
                var columns = MetaDataService.getArray(viewDefNode.viewTypes.viewType.columns.column);

                angular.forEach(columns, function (col, index) {
                    switch (col.type) {
                        case "lookup-hidden":
                        case "lookup":
                            // createEnityTemplate[col.dataDefAttr]["type"] = "EntityReference";
                            createEnityTemplate[col.dataDefAttr] = {
                                Id: "",
                                LogicalName: col.entityLogicalName,
                                Name: ""
                            };
                            if (col.idParameter != null) {
                                var id = $rootScope.appParameters[col.idParameter][0];
                                createEnityTemplate[col.dataDefAttr]["Id"] = id;
                            }
                            if (col.nameParameter != null) {
                                var name = $rootScope.appParameters[col.nameParameter][0];
                                createEnityTemplate[col.dataDefAttr]["Name"] = name;
                            }
                            break;
                        case "money":
                            // createEnityTemplate[col.dataDefAttr]["type"] = "Money";
                            createEnityTemplate[col.dataDefAttr] = { Value: null };
                            break;
                        case "picklist":
                            // createEnityTemplate[col.dataDefAttr]["type"] = "OptionSetValue";
                            if (col.required == "true") {
                                createEnityTemplate[col.dataDefAttr] = "";
                            } else {
                                createEnityTemplate[col.dataDefAttr] = { Value: "" };
                            }
                            break;
                        case "boolean":
                            if (col.defaultValue == null || col.defaultValue == "") {
                                createEnityTemplate[col.dataDefAttr] = false;
                            }
                            else {
                                createEnityTemplate[col.dataDefAttr] = col.defaultValue;
                            }
                            break;
                        default:
                            createEnityTemplate[col.dataDefAttr] = "";
                    }
                    //assumption - transfer params are in the format as expected by column type
                    var transferParams = $scope.transferParams;
                    if (transferParams != null) {
                        angular.forEach(transferParams, function (transferParam, index) {
                            if (col.dataDefAttr == transferParam.name) {
                                createEnityTemplate[col.dataDefAttr] = transferParam.value;
                            }
                        });
                        transferParams.length = 0;
                    }

                });
                
            }
            returnObj.push(createEnityTemplate);
            return returnObj;
        }

        function getDataDefByName(dataDefinitions, dataDefName) {
            if (dataDefinitions != null) {
                if (Object.prototype.toString.call(dataDefinitions) === '[object Array]') {
                    for (var i = 0; i < dataDefinitions.length; i++) {
                        if (dataDefinitions[i].name == dataDefName) {
                            return dataDefinitions[i];
                        }
                    }
                }
                else {
                    if (dataDefinitions.name == dataDefName) return dataDefinitions;
                }
            }
            return null;
        }

        function restoreParamsFromViewDefinition() {
            angular.forEach($scope.viewParameters, function (parameter, index) {
                var columns = MetaDataService.getArray($scope.viewDefinition.viewTypes.viewType.columns.column);
                for (colIndex = 0; colIndex < columns.length; colIndex++) {
                    if (columns[colIndex].dataDefAttr == parameter.name) {
                        columns[colIndex].value = parameter.value;
                        break;
                    }
                }
            });

        }

        function getDataForView(dataDefinitionsForView) {
            var dataHashArray = new Array();
            angular.forEach(dataDefinitionsForView, function (value, index) {
                var dataDef = value;
                var dataForViewDefinition;
                if (ConfigName == null) {
                    var promiseOfPortalApiService;
                    appSpinnerService.startSpinner('app-spinner', 'app-spinner');

                    promiseOfPortalApiService = PortalApiService.getDataFromApiController($scope, dataDef, $scope.viewParameters, $scope.recordCount, $scope.currentPage);
                    //dataHashArray = promiseOfPortalApiService;
                    promiseOfPortalApiService.then(function (apiDataResponse) {
                        dataHashArray[index] = {'dataDefName': dataDef.name, 'records': apiDataResponse};
                        processDataForSelects(apiDataResponse);
                        $scope.data = dataHashArray;
                        appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                    }, function (apiDataResponse) {
                        appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                        toaster.error('', 'Server Error!');
                        console.log("In error callback " + apiDataResponse);
                    });


                } else {
                    var response = CrmDataService.getCrmData(dataDef, $scope.viewParameters, $scope.recordCount);
                    dataForViewDefinition = response.results;
                    dataHashArray[index] = {'dataDefName': dataDef.name, 'records': dataForViewDefinition};
                    if (response.__next != null) {
                        $scope.nextPage = response.__next;
                    }
                }
            });
            return dataHashArray;
        }

        function processDataForSelects(records) {
            var columns = $scope.viewDefinition.viewTypes.viewType.columns.column;
            for (var column in columns) {
                if (columns[column].type == 'picklist') {
                    if (records.length == 1) {
                        var record = records[0];
                        var allowedValues = columns[column].AllowedValues.AllowedValue;
                        for (var allowedValue in  allowedValues) {
                            if (record[columns[column].dataDefAttr] !== undefined && (record[columns[column].dataDefAttr].Value == allowedValues[allowedValue].Value)) {
                                record[columns[column].dataDefAttr] = allowedValues[allowedValue];
                            }
                        }
                    }
                } else if (columns[column].type == 'boolean') {
                    if (records.length == 1) {
                        var record = records[0];
                        if (columns[column].AllowedValues != null) {
                            var allowedValues = columns[column].AllowedValues.AllowedValue;
                            for (var allowedValue in allowedValues) {
                                if (record[columns[column].dataDefAttr] !== undefined && (record[columns[column].dataDefAttr] + "" == allowedValues[allowedValue].Value)) {
                                    record[columns[column].dataDefAttr] = allowedValues[allowedValue];
                                }
                            }
                        }
                    }
                }                
            }
        }

///Returns the promise. Reads only for one data definition
        function getDataForViewAsync(scope, dataDefinitionsForView, viewDef) {
            var dataDef = dataDefinitionsForView[0];
            var promise;
            if (isPortal == true) {
                promise = PortalApiService.getDataFromApiController(scope, dataDef,
                    setRootParamValue(viewDef.viewParameters), scope.recordCount, scope.currentPage);
            } else {
                //TODO
            }

            return promise;
        }

        function setRootParamValue(viewParameters) {
            var returnObj = new Array();
            var viewParams = null;
            if (viewParameters != null && viewParameters.viewParameter != null) {
                viewParams = MetaDataService.getArray(viewParameters.viewParameter);

                for (var i = 0; i < viewParams.length; i++) {
                    if (viewParams[i].isRoot == 'true') {
                        viewParams[i].value = $scope.SelectedRecordId;
                    }
                    if (viewParams[i].name == "LoggedInUserId") {
                        viewParams[i].value = $scope.LoggedInUserId;
                    }
                    if (viewParams[i].type == "LoggedInUserId") {
                        viewParams[i].value = $scope.LoggedInUserId;
                    }
                }

                returnObj = viewParams;

            }
            return returnObj;
        }

        function getViewDefinitionById(viewDefinitions, viewDefId) {
            if (viewDefinitions != null && viewDefinitions.length > 0) {
                for (var i = 0; i < viewDefinitions.length; i++) {
                    if (viewDefinitions[i].viewDefinitionID == viewDefId) {
                        return viewDefinitions[i];
                    }
                }
            }
            return null;
        };

                
        $scope.sendEmail = function (data) {
            //toaster.success('', 'Email Sent');
            if ((data.emailTo == null || data.emailTo == "") && (data.emailToAll == null || data.emailToAll == "")) {
                toaster.error('', 'Select at least 1 contact in "To" field  OR check "Include all Contacts"');
                return;
            }
            appSpinnerService.startSpinner('app-spinner', 'app-spinner');
            PortalApiService.sendEmail(data).then(function () {

                appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                $('.email-page-container').hide({
                    duration: 200
                });
                toaster.pop('success', '', 'Email Sent', 1000);
                $('#toast-container').removeClass('toast-top-full-width').addClass('toast-center toast-email');
                $timeout(function () {
                    $rootScope.$broadcast('afteremailsent', $scope.viewDefinition, null);
                    $('#toast-container').removeClass('toast-center toast-email').addClass('toast-top-full-width');
                }, 2000);
            }, function (response) {
                appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                toaster.error('', 'Server Error!');
                console.log("Error while sending email..." + response);
            });
        };

        $scope.sendEmailUsingSendGrid = function (data) {
            //toaster.success('', 'Email Sent');
            if ((data.emailTo == null || data.emailTo == "") && (data.emailToAll == null || data.emailToAll == "")) {
                toaster.error('', 'Select at least 1 contact in "To" field  OR check "Include all Contacts"');
                return;
            }
            appSpinnerService.startSpinner('app-spinner', 'app-spinner');
            PortalApiService.sendEmailUsingSendGrid(data).then(function () {

                appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                $('.email-page-container').hide({
                    duration: 200
                });
                toaster.pop('success', '', 'Email Sent', 1000);
                $('#toast-container').removeClass('toast-top-full-width').addClass('toast-center toast-email');
                $timeout(function () {
                    $rootScope.$broadcast('afteremailsent', $scope.viewDefinition, null);
                    $('#toast-container').removeClass('toast-center toast-email').addClass('toast-top-full-width');
                }, 2000);
            }, function (response) {
                appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                toaster.error('', 'Server Error!');
                console.log("Error while sending email using send grid..." + response);
            });
        }

        $scope.previewEmail = function (data, viewDefId) {
            //toaster.success('', 'Email Sent');
            if ((data.emailTo == null || data.emailTo == "") && (data.emailToAll == null || data.emailToAll == "")) {
                toaster.error('', 'Select at least 1 contact in "To" field  OR check "Include all Contacts"');
                return;
            }
            if (data.emailTemplate == null || data.emailTemplate.Id == "") {
                toaster.error('', 'Select a template');
                return;
            }
           
            var viewDef = getViewDefinitionById($rootScope.viewDefinitions, viewDefId);
            var modalObject = {
                templateUrl: '/views/Popup.htm',
                controller: 'ModalInstanceCtrl',
                resolve: {
                    passThru: function () {
                        return {
                            data: function () {
                                return PortalApiService.previewEmail(data);
                            },
                            columnDefinition: function () {
                                return viewDef.viewTypes.viewType.columns.column;
                            },
                            lookupcolumn: function () {
                                return null;
                            },
                            title: function () {
                                return viewDef.title;
                            },
                            onOk: function ($modalInstance, selectedItem, lookupColumn) {
                                return $modalInstance.close({item: null, column: null});
                            },
                            hasMoreRecords: function () {
                                return $scope.HasMoreRecords;
                            },
                            getCurrentPage: function () {
                                return $scope.currentPage;
                            },
                            eventHandler: function (event) {                               
                                $scope.handleViewEvent(event);
                            }

                        }
                    }

                }
            }
            var modalInstance = $modal.open(modalObject);
        }

        $scope.getBinaryData = function (columnDef, Id) {
            return PortalApiService.getBinaryData(columnDef.entityName, Id, columnDef.binaryAttribute);
            
        }
        $scope.getAttachment = function (Id) {
            return PortalApiService.getAttachment(Id);
        }

        $scope.initAppParameters = function (viewParameters) {
            var viewParams = MetaDataService.getArray(viewParameters.viewParameter);
            for (var i = 0; i < viewParams.length; i++) {
                if (viewParams[i].isRoot != "true") {
                    $rootScope.appParameters[viewParams[i].name] = [];
                }
            }
        }

        $scope.handleViewEvent = function (event) {
            if (event == "send_email") {
                $scope.sendEmail($scope.data[0]);
            } else if (event == "sendgrid_send_email") {
                $scope.sendEmailUsingSendGrid($scope.data[0]);
            }
        }

        function triggerViewLoadEvent() {
            var viewTypes = MetaDataService.getArray($scope.viewDefinition.viewTypes.viewType);
            var viewType = viewTypes[0];
            var events = MetaDataService.getArray(viewType.events.event);
            for (var ei = 0; ei < events.length; ei++) {
                if (events[ei].type == "before_view_load") {                    
                    $rootScope.eventHandler(events[ei].name, viewType);
                    break;
                }
            }
        }
    }

]);

viewControllerModule.controller('ModalInstanceCtrl', function (MetaDataService, appSpinnerService, toaster, $scope, $rootScope, $modalInstance, $timeout, passThru) {

    $scope.selected = {
        item: null
    };
    
    $scope.loadData = function () {
        appSpinnerService.startSpinner('app-spinner', 'app-spinner');
        
        var promise = passThru.data();
        promise.then(function (apiDataResponse) {
            $scope.allSelected = false;
            var dataHashArray = new Array();
            dataHashArray[0] = {'dataDefName': "", 'records': apiDataResponse};
            $scope.data = dataHashArray;
            $scope.HasMoreRecords = passThru.hasMoreRecords();
            $scope.currentPage = passThru.getCurrentPage();

            /*$scope.selected = {
             item: $scope.data[0].records[0]
             };*/

            appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
        }, function (apiDataResponse) {
            appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
            toaster.error('', 'Server Error!');
            console.log("Error while loading data..." + apiDataResponse);
        });
    }

    $scope.changedSearchText = "";
    $scope.loadDataOnTextChange = function (viewParam) {
        
        var val = viewParam.value;
        if (val === undefined) {
            $rootScope.appParameters[viewParam.name] = [];
            $scope.loadData();
            return;
        } else {

            if (viewParam.valueProperty != null && viewParam.valueProperty != '') {
                val = val[viewParam.valueProperty];
            }
            if (val == "") {
                $rootScope.appParameters[viewParam.name] = [];
            } else {
                $rootScope.appParameters[viewParam.name] = [val];
            }
        }
        
        $scope.changedSearchText = val;
        //console.log("setting value to new value");

        $timeout(function () {
            //console.log("checking if value has changed after call to loadDataOnTextChange ");
            if ($scope.changedSearchText === val) {
                //console.log("calling as user input has not changed search criteria (after 1 sec)");
                $scope.loadData();
            }
        }, 1000);


    };

    if (passThru.initialise) {
        passThru.initialise();
    }
    $scope.loadData();

    //$scope.data = passThru.data();
    $scope.columns = passThru.columnDefinition();
    lookupColumn = passThru.lookupcolumn();
    $scope.modalTitle = passThru.title();

    $scope.ok = function () {
        return passThru.onOk($modalInstance, $scope.selected.item, lookupColumn, $scope.data);
    }

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.getValue = function (attr) {
        return MetaDataService.getAttributeValue(attr);
    }

    $scope.loadNextPage = function () {
        appSpinnerService.startSpinner('app-spinner', 'app-spinner');
        var promise = passThru.nextPageData();
        promise.then(function (apiDataResponse) {
            var dataHashArray = new Array();
            dataHashArray[0] = {'dataDefName': "", 'records': apiDataResponse};
            $scope.data = dataHashArray;
            $scope.HasMoreRecords = passThru.hasMoreRecords();
            $scope.currentPage = passThru.getCurrentPage();
            appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
        }, function (apiDataResponse) {
            appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
            toaster.error('', 'Server Error!');
            console.log("Error while loading data..." + apiDataResponse);
        });
    }

    $scope.loadPreviousPage = function () {
        appSpinnerService.startSpinner('app-spinner', 'app-spinner');
        var promise = passThru.previousPageData();
        promise.then(function (apiDataResponse) {
            var dataHashArray = new Array();
            dataHashArray[0] = {'dataDefName': "", 'records': apiDataResponse};
            $scope.data = dataHashArray;
            $scope.HasMoreRecords = passThru.hasMoreRecords();
            $scope.currentPage = passThru.getCurrentPage();
            appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
        }, function (apiDataResponse) {
            appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
            toaster.error('', 'Server Error!');
            console.log("Error while loading data..." + apiDataResponse);
        });
    }

    $scope.selectAll = function () {
        console.log("Select all");
        for (var i = 0 ; i < $scope.data[0].records.length; i++) {
            $scope.data[0].records[i].selected = $scope.allSelected;
        }
    }
        
    $scope.eventHandler = function (event) {
        passThru.eventHandler(event);
        $modalInstance.dismiss('cancel');
    }
});
