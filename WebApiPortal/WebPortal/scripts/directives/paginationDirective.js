var paginationDirectiveModule = angular.module("paginationDirectiveModule", []);
paginationDirectiveModule.directive('wipfliPagination',
    function () {

        return {
            restrict: 'E',
            replace: true,
            //scope:{
            //    loadNextPage:'=loadNextPage',
            //    loadPreviousPage:'=loadPreviousPage'
            //},
            //transclude: true,
            template: "<button type='button' class='btn btn-sm btn-primary'>Previous</button><button type='button' class='btn btn-sm btn-primary'>Next</button>"
        };
    });