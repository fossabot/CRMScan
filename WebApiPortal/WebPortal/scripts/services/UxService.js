angular.module('UXServiceModule', []).factory('UXService', [
  'MetaDataService',
  function (MetaDataService) {
      var factory = {};
      factory.getDirectiveUrl = function (viewDefinition) {
          var viewMappings = this.getViewMappings().viewMappings;
          var viewType = viewDefinition.type;
          var viewUrl = '';
          angular.forEach(viewMappings, function (value, index) {
              if (value.viewType === viewType) {
                  viewUrl = value.viewUrl;
              }
          });
          return viewUrl;
      };
      factory.getViewMappings = function () {
          return {
              viewMappings: [
                {
                    viewType: 'jQGrid',
                    viewUrl: 'wipfli_TabularView.htm'
                },
                {
                    viewType: 'TimeLine',
                    viewUrl: 'wipfli_TimeLine.htm'
                },
                {
                    viewType: 'Isotope',
                    viewUrl: 'wipfli_Isotope.htm'
                }
              ]
          };
      };
      return factory;
  }
]);