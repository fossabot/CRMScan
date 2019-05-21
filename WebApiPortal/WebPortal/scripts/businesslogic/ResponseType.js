var responseModule = angular.module("ReponseTypeModule", []);
responseModule.factory('ResponseTypeService', ['$rootScope', 'MetaDataService', 'PortalApiService', '$modal', 'toaster',
    function ($rootScope, MetaDataService, PortalApiService, $modal, toaster) {
        var processData = [];
        var responses = {};


        responses.refresh = function (response) {
            $rootScope.$broadcast("refresh", { sourceView: response.sourceViewId, inputParameter: response.inputParameter, targetView: response.targetViewId });
        };
        //Deprecated
        responses.loadPageState = function (response) {
            $rootScope.loadViews($rootScope.pageSelected, response.pageState, null);
        };
        responses.loadPageStates = function (response) {
            var pageStates = response.pageStates.split(",");
            $rootScope.loadViews($rootScope.pageSelected, pageStates, null);
        };

        responses.loadPage = function (response) {
            var pageId = MetaDataService.getResponseParameterValue(response, "pageId");
            var page = MetaDataService.getPageById(pageId);
            $rootScope.loadViews(page, null, null);
        };
        responses.resetAppParameters = function (response) {
            var parameters = MetaDataService.getArray(response.appParameters.parameter);
            for (var i = 0; i < parameters.length; i++) {
                $rootScope.appParameters[parameters[i].name] = [];
            }
        };
        responses.changeCRMEntityStatus = function (response) {
            var parameters = MetaDataService.getArray(response.inputParameters.inputParameter);
            var id = $rootScope.appParameters[parameters[0].name][0];
            var logicalName = response.entityLogicalName;
            var stateCode = response.stateCode;
            var statusCode = response.statusCode;
            var subResponses = MetaDataService.getArray(response.response);

            var promise = PortalApiService.setEntityState(id, logicalName, stateCode, statusCode);
            promise.then(
                function (output) {
                    console.log("Entity Status Changed, " + angular.toJson(output));
                    for (var sri = 0; sri < subResponses.length; sri++) {
                        responses[subResponses[sri].type](subResponses[sri]);
                    }
                },
                function (error) {
                    console.error(error);
                });
        };

        responses.stringCompare = function (response) {
            console.log("Response Type: stringCompare");
            var input1 = MetaDataService.getResponseParameterValue(response, "value1");            
            var input2 = MetaDataService.getResponseParameterValue(response, "value2");
            
            if (input1 === input2) {
                var trueResponses = MetaDataService.getArray(response.trueResponse.response);
                executeSubResponses(trueResponses);
            } else {
                var falseResponses = MetaDataService.getArray(response.falseResponse.response);
                executeSubResponses(falseResponses);
            }
        };

        responses.openPopup = function (response) {
            var template = MetaDataService.getResponseParameterValue(response, "template");
            var viewId = MetaDataService.getResponseParameterValue(response, "sourceViewId");
            var popupEvent = MetaDataService.getResponseParameterValue(response, "popupOkEvent");
            var cancelEvent = MetaDataService.getResponseParameterValue(response, "popupCancelEvent");

            var viewControllerScope = angular.element(document.getElementById(viewId)).scope();
            var modalObject = {
                templateUrl: template,
                controller: 'ModalInstanceCtrl2',
                resolve: {
                    passThru: function () {
                        return {
                            onOK: function ($modalInstance) {
                                $rootScope.eventHandler(popupEvent, viewControllerScope.selectedViewType);
                                $modalInstance.close();
                            },
                            onCancel: function ($modalInstance) {
                                $rootScope.eventHandler(cancelEvent, viewControllerScope.selectedViewType);
                                $modalInstance.dismiss('cancel');
                            }
                        };
                    }
                }
            };
            var modalInstance = $modal.open(modalObject);
        };

        responses.sendContactReassignmentEmail = function (response) {
            var email = MetaDataService.getResponseParameterValue(response, "newemail");
            var repId = MetaDataService.getResponseParameterValue(response, "repid");
            var promise = PortalApiService.sendContactReassignmentEmail(repId, email);
            promise.then(
                function (output) {
                    console.log("Email sent to support");
                    toaster.success('', output);
                    //for (var sri = 0; sri < subResponses.length; sri++) {
                    //    responses[subResponses[sri].type](subResponses[sri]);
                    //}
                },
                function (error) {
                    console.error(error);
                    toaster.success('Error Sending Email', error);
                });
        };

        return responses;

        function executeSubResponses(subResponses) {
            if (subResponses !== null) {
                for (var sri = 0; sri < subResponses.length; sri++) {
                    responses[subResponses[sri].type](subResponses[sri]);
                }
            }
        }

    }]);



