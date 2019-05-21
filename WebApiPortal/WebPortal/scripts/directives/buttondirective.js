var buttonDirectiveModule = angular.module('WipfliButtonDirectiveModule', []);
buttonDirectiveModule.directive('wipfliButton', ['$compile', 'MetaDataService','$rootScope',
  function ($compile, MetaDataService, $rootScope) {

      return {
          restrict: 'E',
          replace: true,
          transclude: true,
          scope:
            {
                column: "=",
                form: "="
            },
          link: function (scope, element, attrs) {
              console.debug("button directive");
              scope.column["isDisabled"] = false;
              var events = MetaDataService.getArray(scope.$parent.selectedViewType.events.event);
              var btnEvent = {};
              for (var i = 0; i < events.length; i++) {
                  if (events[i].name == scope.column.buttonClickEvent) {
                      btnEvent = events[i];
                  }
              }
              var button = "<button ng-disabled='column.isDisabled' ng-click='onButtonClick(column, form)' title='{{column.description}}' class='" + scope.column.controlClass + "'><span ng-if='column.iconClass' class='" + scope.column.iconClass + "'></span>{{column.title}}</button>";
              var aElement = angular.element(button);
              element.append(aElement);

              $compile(element.contents())(scope);

              scope.onButtonClick = function (col, form) {
                  if (form == null || (form != null && form.$valid)) {
                      if (col.disableOnClick == "true") {
                          scope.column["isDisabled"] = true;
                      }
                      else {
                          scope.column["isDisabled"] = false;
                      }
                      $rootScope.eventHandler(btnEvent.name, scope.$parent.selectedViewType);
                  }
              }                            
          }
      };
  }
]);