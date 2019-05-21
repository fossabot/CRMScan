var viewCompositionModule = angular.module("viewCompositionModule", []);
viewCompositionModule.controller('viewCompositionController', ['$scope', '$rootScope', '$location', '$compile',
    '$route', 'ViewCompositionService', 'MetaDataService', '$modal',
        '$cookieStore', 'appSpinnerService', 'toaster', '$timeout', 'ResponseTypeService',
    function ($scope, $rootScope, $location, $compile, $route, ViewCompositionService, MetaDataService, $modal,
        $cookieStore, appSpinnerService, toaster, $timeout, ResponseTypeService) {
        console.log("In viewCompositionController...");
        $scope.defaultRestorer = function (data) {
            return data;
        };
        $scope.setTransferParams = function (data) {
            $scope.transferParams = data;
        };
        $rootScope.logout = function () {
            appSpinnerService.startSpinner('app-spinner', 'app-spinner');
            $rootScope.LoggedInUserId = null;
            $rootScope.LoggedInUserName = null;
            $rootScope.isAuthenticated = false;
            $cookieStore.remove("logged-in-user");
            $location.path("/Login");
            appSpinnerService.stopSpinner('app-spinner', 'app-spinner');

        };
        $rootScope.title = "";
        if ($rootScope.LoggedInUserId == null) {
            console.log("should logout");
            $rootScope.logout();
            return;
        }

        $scope.SelectedRecordId = null;
        if (window.parent.Xrm != null && window.parent.Xrm.Page.data != null) {
            $scope.SelectedRecordId = window.parent.Xrm.Page.data.entity.getId().replace("{", "").replace("}", "");
        }           

        $scope.loadDefaultPage = function () {
            var defaultPage = $rootScope.Pages[0];
            
            $rootScope.loadViews(defaultPage, defaultPage.pageState[0].id);
        };


        var getDefaultRestorer = function (id) {
            var restorer = {
                data: id,
                rFunc: 'defaultRestorer'
            }
            return restorer;
        };

        var getDefaultRestorerIfNotNull = function (id) {
            return id == null ? null : getDefaultRestorer(id);
        };

        $rootScope.viewcomposition = null;
        $rootScope.viewDefinitions = [];
        $rootScope.pageViews = new Array();
        $rootScope.Pages = new Array();

        if (ConfigName == null) {
            var promiseFromViewComposition = ViewCompositionService.getViewComposition();
            promiseFromViewComposition.then(function (viewCompositionResponse) {
                $scope.viewcomposition = viewCompositionResponse;
                addToViewDefinitionsList();
                addToPagesList();
                if ($rootScope.isAppParameterInitialized != true) {
                    initializeAppParameters();
                }
                if (!$rootScope.loadFromLocation()) {
                    $scope.loadDefaultPage();
                }
            }, function (reason) {
                toaster.error('', 'Server Error!');
                console.log("Error reading metadata " + reason.data);
            });
        }
        else {
            $rootScope.viewcomposition = ViewCompositionService.getViewComposition();
            addToViewDefinitionsList();
            addToPagesList();
        }

        function addToPagesList() {
            if ($scope.viewcomposition.pages != null && $scope.viewcomposition.pages.page != null) {
                if (Object.prototype.toString.call($scope.viewcomposition.pages.page) == '[object Array]') {
                    $rootScope.Pages = $scope.viewcomposition.pages.page;
                }
                else {
                    $rootScope.Pages.push($scope.viewcomposition.pages.page);
                }
            }

        }


        function addToViewDefinitionsList() {
            if ($scope.viewcomposition.viewDefinitions.viewDefinition.length == null) {
                $rootScope.viewDefinitions.push($scope.viewcomposition.viewDefinitions.viewDefinition);
            }
            else {
                angular.forEach($scope.viewcomposition.viewDefinitions.viewDefinition, function (value, index) {
                    $rootScope.viewDefinitions.push(value);
                });
            }
        }

        $scope.getPageById = function (pageId) {
            var page = null;
            angular.forEach($rootScope.Pages, function (item) {
                if (item.id == pageId) {
                    page = item;
                }
            });
            return page;
        };

        $rootScope.loadFromLocation = function () {
            var pageId = $route.current.params.pageId;
            if (pageId && pageId != null) {
                var page = $scope.getPageById(pageId);
                var states = [$route.current.params.state];
                //if (states[0] === "search") {
                //    states.push("list");
                //}
                var dataRestorer = $route.current.params.data;
                var data = undefined;
                if (dataRestorer) {
                    dataRestorer = JSON.parse(dataRestorer);
                    var rFunc = $scope.$eval(dataRestorer.rFunc);
                    data = rFunc(dataRestorer.data);
                }
                $rootScope._loadViews(page, states, data);
                return true;
            }
            return false;
        };

        $rootScope.loadViews = function (page, pageState, data) {
            var state = pageState;
            var pageId = page.id;
            if (pageState === null || pageState === undefined) {
                var pageStates = MetaDataService.getArray(page.pageState);
                state = pageStates[0].id;
            }
            //for (i = 0; i < pageStates.length; i++) {
            //    if (pageStates[i] != "list") {
            //        state = pageStates[i];

            //        pageId = page.id;

            //        break;
            //    }

            //}
            //timeout is needed else menu appears expanded even after next page is loaded
            $timeout(function () {
                $location.path("/MetaData/" + pageId + "/" + state + "/" + (data ? JSON.stringify(data) : ""));
            }, 0);
        };

        $rootScope._loadViews = function (page, pageStates, data) {
            if (page === undefined || page.pageState === undefined || page.pageState[0] === null) {
                toaster.error('', 'Page not found');
                return;
            }

            $rootScope.pageSelected = page;
            $rootScope.pageViews = new Array();
            $scope.SelectedRecordId = null;
            for (i = 0; i < pageStates.length; i++) {
                var pageStateName = pageStates[i];
                $scope.SelectedRecordId = data;
                var pageState = MetaDataService.getPageStateByName(page, pageStateName);
                var detailViews = MetaDataService.getArray(pageState.viewDefinition);
                addViewsToPageViews(detailViews);

                //if (pageStates[i] == "list") {
                //    var listViews = MetaDataService.getArray(page.list.viewDefinition);
                //    addViewsToPageViews(page.list.viewDefinition.title, listViews);
                //} else {

                //    if (pageStates[i] == "search") {
                //        var searchViews = MetaDataService.getArray(page.search.viewDefinition);
                //        addViewsToPageViews(page.search.viewDefinition.title, searchViews);
                //    }
                //    else if (pageStates[i] == "create") {
                //        var createViews = MetaDataService.getArray(page.create.viewDefinition);
                //        addViewsToPageViews(page.create.viewDefinition.title, createViews);
                //    }

                //    else {
                //        var pageState = pageStates[i];
                //        $scope.SelectedRecordId = data;
                //        var detailViews = MetaDataService.getArray(page[pageState].viewDefinition);
                //        addViewsToPageViews(page[pageState].viewDefinition.title, detailViews);
                //    }
                //}
            }

            $timeout(function () {
                window.scrollTo(0, 1);
            }, 0);

        };


        var navigateIfConfigured = function (att, id, navtoPageId) {
            if (att) {
                $scope.SelectedRecordId = id;

                var targetPage = $rootScope.pageSelected;
                if (navtoPageId) {
                    targetPage = $scope.getPageById(navtoPageId);
                }

                var viewArray = att.split(",");
                $rootScope.loadViews(targetPage, viewArray, getDefaultRestorerIfNotNull(id));
                return true;
            }
            return false;
        };


        $scope.onList = function () {
            $rootScope.loadViews($rootScope.pageSelected);
        };

        $scope.onCreate = function () {
            $rootScope.loadViews($rootScope.pageSelected, ["create"]);
        };

        $scope.onEdit = function (id) {
            $scope.SelectedRecordId = id;
            $rootScope.loadViews($rootScope.pageSelected, ["edit"], getDefaultRestorer(id));
        };


        $scope.onSelect = function (viewDefinition, id) {
            navigateIfConfigured(viewDefinition.navOnSelect, id, viewDefinition.navToPage);
        };

        $scope.onBack = function (viewDefinition, id) {
            if (navigateIfConfigured(viewDefinition.navOnBack, id, viewDefinition.navToPage)) {
                return;
            }
            $rootScope.loadViews($rootScope.pageSelected);
        };
        $scope.navigateTo = function (navToPage, id) {            
            navigateIfConfigured(navToPage, id, null);
        };

        $scope.emailTo = function (record) {
            var page = $scope.getPageById('Email');
            $scope.transferParams = new Array();
            $scope.transferParams[0] = {
                name: "emailTo",
                value: [{
                    Name: record["fullname"],
                    Id: record ["contactid"]
                }]
            };
            var restorer = {
                data: $scope.transferParams,
                rFunc: 'setTransferParams'
            }
            $rootScope.loadViews(page, ["create"], restorer);
        }


        $scope.$on("aftercreate", function (event, args) {
            $rootScope.loadViews($rootScope.pageSelected, ["search", "list"]);
        });

        $scope.$on("afteredit", function (event, viewDefinition, id) {
            if (navigateIfConfigured(viewDefinition.navOnSave, id, viewDefinition.navToPage)) {
                return;
            }
            $rootScope.loadViews($rootScope.pageSelected, ["search", "list"]);
        });

        $scope.$on("afteremailsent", function (event, viewDefinition, id) {
            if (navigateIfConfigured(viewDefinition.navOnSave, id, viewDefinition.navToPage)) {
                return;
            }
            $rootScope.loadViews($rootScope.pageSelected, ["search", "list"]);
        });
                
        function addViewsToPageViews(viewNames) {
            for (var i = 0; i < viewNames.length; i++) {
                angular.forEach($scope.viewDefinitions, function (value, index) {
                    if (viewNames[i].id === value.viewDefinitionID) {
                        $rootScope.pageViews.push(value);
                       // $rootScope.title = title;
                    }
                });
            }
        };

        $scope.loadProfileSettings = function () {
            var page = $scope.getPageById('ProfileSettings');
            $rootScope.loadViews(page, ["edit"]);
        };


        $scope.loadPageViews = function (pageId, pageStates) {
            var page = $scope.getPageById(pageId);
            $scope.loadViews(page, pageStates);
        };

        function initializeAppParameters() {
            $rootScope.appParameters = {};
            $rootScope.appParameters["LoggedInUserId"] = [$rootScope.LoggedInUserId];
            $rootScope.appParameters["LoggedInUserName"] = [$rootScope.LoggedInUserName];
            if ($scope.viewcomposition.viewParameters != null) {
                var params = MetaDataService.getArray($scope.viewcomposition.viewParameters.viewParameter);
                for (var i = 0; i < params.length; i++) {
                    $rootScope.appParameters[params[i].name] = [params[i].value];
                    if ($cookieStore.get([params[i].name]) != null) {
                        $rootScope.appParameters[params[i].name] = $cookieStore.get([params[i].name]);
                    }
                }
            }
            $rootScope.isAppParameterInitialized = true;
        }

        $rootScope.eventHandler = function (eventName, viewType) {
            var actions = MetaDataService.getArray(viewType.actions.action);
            if (actions != null && actions.length > 0) {
                for (intCount = 0; intCount < actions.length; intCount++) {
                    if (actions[intCount].event == eventName) {
                        var aresponses = MetaDataService.getArray(actions[intCount].response);
                        if (aresponses != null && aresponses.length > 0) {
                            for (var intEventCount = 0; intEventCount < aresponses.length; intEventCount++) {
                                ResponseTypeService[aresponses[intEventCount].type](aresponses[intEventCount]);

                            }
                        }
                        break;
                    }
                }
            }
        }

    }]);



