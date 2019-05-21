var isoTopeDirectiveModule = angular.module('isoTopeDirectiveModule', []);
isoTopeDirectiveModule.directive('wipfliIsotope', [
  'ImageService',
  'MetaDataService',
  '$compile', '$rootScope', '$cookieStore',
  function (ImageService, MetaDataService, $compile, $rootScope, $cookieStore) {
    
      return {
          restrict: 'E',
          replace: true,
          link: function (scope, element, attrs) {

              var configForViewDefinition = scope.viewDefinition;

              scope.today = function () {
                  scope.dt = new Date();
              };
              scope.today();

              scope.clear = function () {
                  scope.dt = null;
              };

              // Disable weekend selection
              scope.disabled = function (date, mode) {
                  return (mode === 'day' && (date.getDay() === 0 || date.getDay() === 6));
              };

              scope.open = function ($event, record, dataDefAttribute) {
                  $event.preventDefault();
                  $event.stopPropagation();
                  record["isOpen_" + dataDefAttribute] = true;
              };

              scope.openForCreate = function ($event, index) {
                  $event.preventDefault();
                  $event.stopPropagation();
                  scope.opened[index] = true;
              };

              scope.dateOptions = {
                  formatYear: 'yy',
                  startingDay: 1
              };

              scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
              scope.format = scope.formats[0];
              scope.opened = new Array(scope.viewDefinition.viewTypes.viewType.columns.column.length);
              for (var i = 0; i < scope.opened.length; i++) {
                  scope.opened[i] = false;
              }
              console.log(configForViewDefinition.viewState);

              scope.onChangeValue = function (value, columnDef) {
                  var param = columnDef.valueChangeParameter;

                  var colValue = value;
                  if (columnDef.property != null && columnDef.property != "") {
                      colValue = value[columnDef.property];
                  }
                  if (colValue == null || colValue == "") {
                      $rootScope.appParameters[param] = [];
                  } else {
                      $rootScope.appParameters[param] = [colValue];
                  }

              }

              scope.onRecordSelected = function (viewType, record) {
                  var events = MetaDataService.getArray(viewType.events.event);
                  for (var ei = 0; ei < events.length; ei++) {
                      if (events[ei].type == "record_selected") {
                          var params = MetaDataService.getArray(events[ei].recordSelectParameter);
                          for (var pi = 0; pi < params.length; pi++) {
                              $rootScope.appParameters[params[pi].name] = [getEventValue(record, params[pi])];
                              if (params[pi].cache == "true") {
                                  $cookieStore.put([params[pi].name], [getEventValue(record, params[pi])]);
                              }
                          }
                         $rootScope.eventHandler(events[ei].name, viewType);
                          break;
                      }
                  }

              }
              function getEventValue(record, parameter) {
                  var val;
                  if (parameter.attribute != null && record[parameter.attribute] != null) {
                      if (parameter.property != null) {
                          val = record[parameter.attribute][parameter.property];
                      }
                      else {
                          val = record[parameter.attribute];
                      }
                  }
                  return val;
              }

          }
          
      };
  }
]);