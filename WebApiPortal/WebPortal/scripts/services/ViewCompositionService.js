var metaDataXml = '';
angular.module('ViewCompositionServiceModule', []).factory('ViewCompositionService', [
    '$http', 'toaster',
    function ($http, toaster) {
        var factory = {};
        var xmlString = '';
        factory.getViewComposition = function () {
            var viewComposition = null;
            if (ConfigName == null) {
                var promise = factory.getViewCompositionFromPortal();
                return promise;
            } else {
                var options = '$select=wipfli_ViewComposition&$filter=wipfli_name eq \'' + ConfigName + '\'';
                var results = SDK.REST.retrieveMultipleRecords('wipfli_dataviewerconfig', options);
                console.log('Inside view composition : ' + results[0].wipfli_ViewComposition);
                viewComposition = $.xml2json(results[0].wipfli_ViewComposition);
                return viewComposition;
            }
            return viewComposition;
        };
        factory.getMetaData = function (callbackMethod) {
            try {
                var xmlPath = '';
                var options = '$select=wipfli_ViewComposition&$filter=wipfli_name eq \'View Composition\'';
                SDK.REST.retrieveMultipleRecordsAsync('wipfli_dataviewerconfig', options, callbackMethod, retrieveMultipleRecordserrorCallback, retrieveMultipleRecordsCompleteCallback);
            } catch (e) {
                toaster.error('', 'Error while reading XML; Description \ufffd' + e.description);
                console.log('Error while reading XML; Description \ufffd' + e.description);
            }
        };
        factory.getViewCompositionFromPortal = function () {
            var d = $.Deferred();
            $http.get('/config/MetaData.xml').then(function (response) {
                //console.log('Inside getViewCompositionFromPortal : ' + response.data);
                if (response != null && response.data != null) {
                    var viewComposition = $.xml2json(response.data);
                    d.resolve(viewComposition);
                }
            }, function (error) {
                toaster.error('', 'Server Error!');
                d.reject(error);
                console.log('This is the Error message ' + error);
            });
            return d;
        };
        factory.getViewCompositionFromCrm = function () {
            var d = $.Deferred();
            var options = '$select=wipfli_ViewComposition&$filter=wipfli_name eq \'' + ConfigName + '\'';
            var results = SDK.REST.retrieveMultipleRecords('wipfli_dataviewerconfig', options);
            console.log('Inside view composition : ' + results[0].wipfli_ViewComposition);
            viewComposition = $.xml2json(results[0].wipfli_ViewComposition);
            return viewComposition;
            return d;
        };
        return factory;
    }
]);