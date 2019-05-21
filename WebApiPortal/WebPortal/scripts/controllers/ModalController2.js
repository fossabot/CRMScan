viewControllerModule.controller('ModalInstanceCtrl2', [
    'MetaDataService', 'appSpinnerService', 'toaster', '$scope', '$rootScope', '$modalInstance', '$timeout', 'passThru',
    function (MetaDataService, appSpinnerService, toaster, $scope, $rootScope, $modalInstance, $timeout, passThru) {

        $scope.ok = function () {
            passThru.onOK($modalInstance);
        };

        $scope.cancel = function () {
            passThru.onCancel($modalInstance);
        };
                
    }]);
