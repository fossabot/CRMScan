var fileUploadMod = angular.module('fileUploadModule', ['ngFileUpload']);
var version = '4.2.0';

fileUploadMod.controller('fileController', ['$scope', '$http', '$timeout', '$compile', 'Upload', 'AppConfig', 'appSpinnerService', '$rootScope', 'MetaDataService',
    function ($scope, $http, $timeout, $compile, Upload, AppConfig, appSpinnerService, $rootScope, MetaDataService) {
        $scope.currentFileName = "";
        $scope.currentFileExt = "";
        $scope.showFileNameInput = false;
        $scope.selectedFiles = null;
        $scope.usingFlash = FileAPI && FileAPI.upload != null;
        $scope.isProfilePicture = false;
        $scope.changeAngularVersion = function () {
            window.location.hash = $scope.angularVersion;
            window.location.reload(true);
        };
        var viewParams = MetaDataService.getArray($scope.viewDefinition.viewParameters.viewParameter);
        $scope.SelectedRecordId = $rootScope.appParameters[viewParams[0].name][0];

        $scope.angularVersion = window.location.hash.length > 1 ? (window.location.hash.indexOf('/') === 1 ?
                window.location.hash.substring(2) : window.location.hash.substring(1)) : '1.2.20';

        $scope.$watch('selectedFiles', function (files) {
            $scope.formUpload = false;
            if (files != null && files.length > 0) {
                var filename = files[0].name;
                var li = filename.lastIndexOf(".");
                var fileExt = filename.substring(li, filename.length);
                $scope.currentFileName = filename.substring(0, li);
                $scope.currentFileExt = fileExt;
                $scope.showFileNameInput = true;
            }
        });

        $scope.uploadAFile = function(files){
            $scope.formUpload = false;
            if (files != null && files.length>0) {
                upload(files[0]);
            }
        }

        function upload(file) {
            $scope.errorMsg = null;
            uploadUsingUpload(file);
        }

        function uploadUsingUpload(file) {
            //$scope.currentFileName = file.name;
            //alert($scope.currentFileName);
            appSpinnerService.startSpinner('app-spinner', 'app-spinner');
            var url = "";
            if ($scope.isProfilePicture == true) {
                url = "api/setentityimage";
                file.upload = Upload.upload({
                    url: AppConfig.URL_WEB_API + '/api/setentityimage/{' + $scope.SelectedRecordId + '}/' + $scope.viewDefinition.regardingEntityName,
                    method: 'POST',
                    headers: {
                        'my-header': 'my-header-value'
                    },
                    file: file,
                    fileFormDataName: 'myFile'
                });
            }
            else {
                var filename = file.name;
                
                if ($scope.currentFileName != null && $scope.currentFileName.length > 0) {
                    var li = filename.lastIndexOf(".");
                    var fileExt = filename.substring(li, filename.length);
                    filename = $scope.currentFileName + fileExt;
                }

                file.upload = Upload.upload({
                    url: AppConfig.URL_WEB_API + '/api/EntityApi/CreateAttachment',
                    method: 'POST',
                    headers: {
                        'my-header': 'my-header-value'
                    },
                    //fields: { username: $scope.username },
                    file: file,
                    fileFormDataName: 'myFile',
                    params: {
                        objectId: $scope.SelectedRecordId,
                        entityLogicalName: $scope.viewDefinition.regardingEntityName,
                        fileName: filename
                    }
                });
            }

            file.upload.then(function (response) {
                appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                $timeout(function () {
                    file.result = response.data;
                    //  alert(" Success of File Upload "+file.result);
                    $scope.navigateTo('view', $scope.SelectedRecordId)
                });
            }, function (response) {
                appSpinnerService.stopSpinner('app-spinner', 'app-spinner');
                if (response.status > 0)
                    $scope.errorMsg = response.status + ': ' + response.data;
            });

            file.upload.progress(function (evt) {
                // Math.min is to fix IE which reports 200% sometimes
                file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                $scope.fileUploadProgress = file.progress;
                $scope.progressStyle = "width:'" + file.progress + "'%;";
            });

            file.upload.xhr(function (xhr) {
                // xhr.upload.addEventListener('abort', function(){console.log('abort complete')}, false);
            });
        }

        function attachmentCreated() {
            //alert("File is uploaded ");
        }

        if (localStorage) {
            $scope.s3url = localStorage.getItem('s3url');
            $scope.AWSAccessKeyId = localStorage.getItem('AWSAccessKeyId');
            $scope.acl = localStorage.getItem('acl');
            $scope.success_action_redirect = localStorage.getItem('success_action_redirect');
            $scope.policy = localStorage.getItem('policy');
            $scope.signature = localStorage.getItem('signature');
        }

        $scope.success_action_redirect = $scope.success_action_redirect || window.location.protocol + '//' + window.location.host;
        $scope.jsonPolicy = $scope.jsonPolicy || '{\n  "expiration": "2020-01-01T00:00:00Z",\n  "conditions": [\n    {"bucket": "angular-file-upload"},\n    ["starts-with", "$key", ""],\n    {"acl": "private"},\n    ["starts-with", "$Content-Type", ""],\n    ["starts-with", "$filename", ""],\n    ["content-length-range", 0, 524288000]\n  ]\n}';
        $scope.acl = $scope.acl || 'private';

        $scope.confirm = function () {
            return confirm('Are you sure? Your local changes will be lost.');
        };

        $scope.getReqParams = function () {
            return $scope.generateErrorOnServer ? '?errorCode=' + $scope.serverErrorCode +
                    '&errorMessage=' + $scope.serverErrorMsg : '';
        };

        angular.element(window).bind('dragover', function (e) {
            e.preventDefault();
        });
        angular.element(window).bind('drop', function (e) {
            e.preventDefault();
        });

        $timeout(function () {
            $scope.capture = localStorage.getItem('capture' + version) || 'camera';
            $scope.accept = localStorage.getItem('accept' + version) || 'image/*,audio/*,video/*';
            $scope.acceptSelect = localStorage.getItem('acceptSelect' + version) || 'image/*,audio/*,video/*';
            $scope.disabled = localStorage.getItem('disabled' + version) == 'true' || false;
            $scope.multiple = localStorage.getItem('multiple' + version) == 'true' || false;
            $scope.allowDir = localStorage.getItem('allowDir' + version) == 'true' || true;
            $scope.$watch('capture+accept+acceptSelect+disabled+capture+multiple+allowDir', function () {
                localStorage.setItem('capture' + version, $scope.capture);
                localStorage.setItem('accept' + version, $scope.accept);
                localStorage.setItem('acceptSelect' + version, $scope.acceptSelect);
                localStorage.setItem('disabled' + version, $scope.disabled);
                localStorage.setItem('multiple' + version, $scope.multiple);
                localStorage.setItem('allowDir' + version, $scope.allowDir);
            });
        });

    }]);
