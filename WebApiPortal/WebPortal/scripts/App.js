var wipfliModule = angular.module('CrmApp', [
    'ngAnimate', 'ngRoute', 'ngCookies', 'ngMessages',
    'viewCompositionModule',
    'ViewCompositionServiceModule',
    'ODataRetrievalModule',
    'viewModule',
    'ImageServiceModule',

    'MetaDataServiceModule',
    'CrmDataServiceModule',

    'isoTopeDirectiveModule',

    'PortalApiServiceModule',

    'ui.bootstrap',
    'AuthenticaionModule',
    'MultiLookupDirectiveModule',
    'LookupDirectiveModule',
    'HomeModule',
    'LoginModule',
    'OrgChartDirectiveModule',
    'angularSpinner',
    'AppSpinnerModule',
    'FormValidationDirectiveModule',
    'toaster',
    'WipfliCdataModule'
    , 'WipfliHtmlModule'
    , 'WipfliBinaryImageModule'
    , 'fileUploadModule'
    , 'WipfliBinaryDataModule'
    , 'ReponseTypeModule'
    , 'WipfliButtonDirectiveModule'
]);

wipfliModule.config([
    '$routeProvider', 'AppConfig',
    function ($routeProvider, AppConfig) {

        if (ConfigName == null) {
            var landingPageTemplateUrl = '';
            var landingPageController = '';
            if (AppConfig.LANDING_PAGE == 'home') {
                landingPageTemplateUrl = '/views/Home.htm';
                landingPageController = 'HomeController';
            } else if (AppConfig.LANDING_PAGE == 'login') {
                landingPageTemplateUrl = '/views/Login.htm';
                landingPageController = 'LoginController';
            }
            $routeProvider.when('/', {
                templateUrl: landingPageTemplateUrl,
                controller: landingPageController
            })
                .when('/Login', {
                    templateUrl: '/views/Login.htm',
                    controller: 'LoginController'
                })
                .when('/MetaData', {
                    templateUrl: '/views/ViewComposition.htm',
                    controller: 'viewCompositionController'
                })
                .when('/MetaData/:pageId?/:state?/:data?', {
                    templateUrl: '/views/ViewComposition.htm',
                    controller: 'viewCompositionController'
                })
                .otherwise({redirectTo: '/'});
        } else {
            $routeProvider.when('/', {
                templateUrl: 'wipfli_Home.htm',
                controller: 'HomeController'
            })
                .when('/Login', {
                    templateUrl: 'wipfli_Login.htm',
                    controller: 'LoginController'
                })
                .when('/MetaData', {
                    templateUrl: 'wipfli_viewComposition.html',
                    controller: 'viewCompositionController'
                })
                .otherwise({redirectTo: '/'});
        }
    }
]);
wipfliModule.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|sms|tel|chrome-extension):/);
}]);

wipfliModule.filter('phonenumber', function () {
    /* 
     Format phonenumber as: c (xxx) xxx-xxxx
     or as close as possible if phonenumber length is not 10
     if c is not '1' (country code not USA), does not use country code
     */

    return function (number) {
        /* 
         @param {Number | String} number - Number that will be formatted as telephone number
         Returns formatted number: (###) ###-####
         if number.length < 4: ###
         else if number.length < 7: (###) ###

         Does not handle country codes that are not '1' (USA)
         */
        if (!number) {
            return '';
        }

        number = String(number);

        // Will return formattedNumber. 
        // If phonenumber isn't longer than an area code, just show number
        var formattedNumber = number;

        // if the first character is '1', strip it out and add it back
        var c = (number[0] == '1') ? '1 ' : '';
        number = number[0] == '1' ? number.slice(1) : number;

        // # (###) ###-#### as c (area) front-end
        var area = number.substring(0, 3);
        var front = number.substring(3, 6);
        var end = number.substring(6, 10);

        if (front) {
            formattedNumber = (c + "(" + area + ") " + front);
        }
        if (end) {
            formattedNumber += ("-" + end);
        }
        return formattedNumber;
    };
});

angular.module('CrmApp').run(function ($cookieStore, $rootScope, appSpinnerService, toaster, $timeout, $modalStack) {
    var apiDataResponse = $cookieStore.get("logged-in-user");
    if (apiDataResponse) {
        $rootScope.LoggedInUserId = apiDataResponse.Attributes[0].Value;
        $rootScope.LoggedInUserName = apiDataResponse.Attributes[1].Value;
    }

    $rootScope.loadNextPageContent = function (scope, configName, portalApiService, crmDataService) {
        $timeout(function () {
            window.scrollTo(-50, 0);
        }, 0);
        scope.loadimage = true;
        scope.currentPage++;
        if (configName == null) {
            var promiseOfPortalApiService;
            appSpinnerService.startSpinner('app-spinner', 'app-spinner');
            promiseOfPortalApiService = portalApiService.getDataFromApiController(scope, scope.dataDefinitions[0], scope.viewParameters, scope.recordCount, scope.currentPage);
            promiseOfPortalApiService.then(function (apiDataResponse) {
                //dataHashArray[index] = { 'dataDefName': dataDef.name, 'records': apiDataResponse };
                scope.data[0] = {'records': apiDataResponse};
                scope.loadimage = false;
                appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
            }, function (apiDataResponse) {
                appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                toaster.error('Server Error!');
                console.log("In error callback " + apiDataResponse);
            });
        } else {
            var response = crmDataService.getCrmDataByOdataQuery(scope.dataDefinitions[0], scope.viewParameters, scope.recordCount, scope.currentPage * scope.recordCount);
            if (response != null) {
                var records = response.results;
                scope.data[0] = {"records": records};
            } else scope.currentPage--;
        }

    }

    $rootScope.loadPreviousPageContent = function (scope, configName, portalApiService, crmDataService) {
        $timeout(function () {
            window.scrollTo(0, 0);

        }, 0);
        scope.loadimage = true;
        if (configName == null) {
            if (scope.currentPage > 0) {
                scope.currentPage--;
                var promiseOfPortalApiService;
                appSpinnerService.startSpinner('app-spinner', 'app-spinner');
                promiseOfPortalApiService = portalApiService.getDataFromApiController(scope, scope.dataDefinitions[0], scope.viewParameters, scope.recordCount, scope.currentPage);
                promiseOfPortalApiService.then(function (apiDataResponse) {
                    //dataHashArray[index] = { 'dataDefName': dataDef.name, 'records': apiDataResponse };
                    scope.data[0] = {'records': apiDataResponse};
                    scope.loadimage = false;
                    appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                }, function (apiDataResponse) {
                    appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                    toaster.error('Server Error!');
                    console.log("In error callback " + apiDataResponse);
                });
            }
        } else {
            if ($scope.currentPage > 0) {
                scope.currentPage--;
                var response = crmDataService.getCrmDataByOdataQuery(scope.dataDefinitions[0], scope.viewParameters, scope.recordCount, scope.currentPage * scope.recordCount);
                if (response != null) {
                    var records = response.results;
                    scope.data[0] = {"records": records};
                }
            }
        }
    }
    $rootScope.setTextAreaHeight = function (textarea, event) {

        var minHeight = $(textarea).attr('rows') * 20 + 12 + 2;

        var dummy = $('#_dummy');
        dummy.css("width", textarea.scrollWidth + "px");
        dummy.attr("class", $(textarea).attr('class'));
        dummy.val($(textarea).val());
        dummy.css("height", (minHeight) + "px");

        var requiredHeight = dummy[0].scrollHeight + 2;

        requiredHeight = minHeight > requiredHeight ? minHeight : requiredHeight;


        $(textarea).css("height", requiredHeight + "px");
    };

    $(document).on('input', '.auto-expand', function (event, target) {
        $rootScope.setTextAreaHeight(this, event);
    });

    $rootScope.$on('$routeChangeSuccess', function (newVal, oldVal) {
        if (oldVal !== newVal) {
            $modalStack.dismissAll();
        }
    });
});

/*
 wipfliModule.config(['usSpinnerConfigProvider', function (usSpinnerConfigProvider) {
 usSpinnerConfigProvider.setDefaults({ color: 'red' });
 }]);*/