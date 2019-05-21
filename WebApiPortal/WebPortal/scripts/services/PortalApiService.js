PortalApiServiceModule = angular.module('PortalApiServiceModule', []).factory('PortalApiService',
    ['$http', '$rootScope', 'AppConfig',
        function ($http, $rootScope, AppConfig) {
            var factory = {};
            factory.getDataFromApiController = function (scope, dataDef, viewParameters, recordCount, currentPage) {
                var d = $.Deferred();
                var filters = new Array();
                var filterConditions = new Array();
                var orderByClauses = new Array();
                var filterString = '';
                if (dataDef != null) {
                    var odataQuery = dataDef.odataQuery;
                    var attrName;
                    var attrValue;
                    if (odataQuery != null) {
                        var selectArray = odataQuery.select.split(',');
                        if (dataDef.odataQuery.filters.filter != null) {
                            if (Object.prototype.toString.call(dataDef.odataQuery.filters.filter) === '[object Array]') {
                                filters = dataDef.odataQuery.filters.filter;
                            }
                            else {
                                filters.push(dataDef.odataQuery.filters.filter);
                            }
                        }
                        if (dataDef.odataQuery.orders != null && dataDef.odataQuery.orders.order != null) {
                            if (Object.prototype.toString.call(dataDef.odataQuery.orders.order) === '[object Array]') {
                                orderByClauses = dataDef.odataQuery.orders.order;
                            }
                            else {
                                orderByClauses.push(dataDef.odataQuery.orders.order);
                            }
                        }
                        if (viewParameters != null) {
                            for (var f = 0; f < filters.length; f++) {
                                if (filters[f].viewParamName == "") {
                                    filterConditions.push({
                                        attributeName: filters[f].attributeName,
                                        attributeValue: filters[f].attributeValue,
                                        operator: filters[f].operator,
                                        attributeType: filters[f].attributeType
                                    });
                                }
                                else {
                                    for (var i = 0; i < viewParameters.length; i++) {
                                        if (viewParameters[i].name == filters[f].viewParamName) {
                                            if ($rootScope.appParameters[viewParameters[i].name] != null
                                                && $rootScope.appParameters[viewParameters[i].name][0] != null
                                                && $rootScope.appParameters[viewParameters[i].name][0] != '') {
                                                filterConditions.push({
                                                    attributeName: filters[f].attributeName,
                                                    attributeValue: $rootScope.appParameters[viewParameters[i].name][0],
                                                   // attributeValue: viewParameters[i].value,
                                                    operator: filters[f].operator,
                                                    attributeType: viewParameters[i].attributeType
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (filterString != null && filterString.length > 0) {
                            filterString = filterString.replace(" and ", "");
                        }
                        $http({
                            method: 'GET',
                            url: AppConfig.URL_WEB_API + '/api/EntityApi/RetrieveMultipleEntities',
                            params: {
                                ODataQuery: {
                                    EntityName: odataQuery.entity,
                                    Columns: selectArray,
                                    FilterConditions: filterConditions,
                                    OrderByClauses: orderByClauses,
                                    PagingInfo: {
                                        PageNumber: currentPage,
                                        PagingCookie: scope.PagingCookie,
                                        Count: recordCount
                                    }
                                }
                            }
                        }).success(function (data, status, headers, config) {
                            if (data.Data != null) {
                                scope.loadimage = false;
                                scope.HasMoreRecords = data.Data.HasMoreRecords;
                                d.resolve(data.Data.recordsCollection);
                            }
                        }).error(function (data, status, headers, config) {
                            d.reject(data, status);
                        });
                    }
                }
                return d;
            };

            factory.CreateCrmEntityFromPortal = function (record, entitySchemaName, columnsArray) {
                var d = $.Deferred();
                if (record != null) {
                    $http({
                        method: 'POST',
                        url: AppConfig.URL_WEB_API + '/api/EntityApi/CreateEntity',
                        params: {
                            createEntityName: entitySchemaName
                        },
                        data: {
                            PortalAttributes: record,
                            entityName: entitySchemaName,
                            Id: "00000000-0000-0000-0000-000000000000",
                            Columns: columnsArray
                        }
                    }).success(function (data, status, headers, config) {
                        d.resolve(data.Data);
                       // $rootScope.$broadcast('aftercreate', null);
                    }).error(function (data, status, headers, config) {
                        d.reject(data, status);
                    });
                }
                return d;
            };

            factory.UpdateCrmEntityFromPortal = function (recordId, record, entitySchemaName, columnsArray) {
                var d = $.Deferred();
                if (record != null) {
                    $http({
                        method: 'POST',
                        url: AppConfig.URL_WEB_API + '/api/EntityApi/UpdateEntity',
                        params: {
                            id: recordId,
                            entityName: entitySchemaName
                        },
                        data: {
                            PortalAttributes: record,
                            entityName: entitySchemaName,
                            Id: recordId,
                            Columns: columnsArray
                        }
                    }).success(function (data, status, headers, config) {
                        d.resolve(data.Data);
                    }).error(function (data, status, headers, config) {
                        d.reject(data, status);
                    });
                }
                return d;
            };

            factory.sendEmail = function (record) {
                var d = $.Deferred();

                if (record != null) {
                    $http({
                        method: 'POST',
                        url: AppConfig.URL_WEB_API + '/api/Email/SendEmail',
                        data: {
                            To: record['emailTo'],
                            FromUserId: $rootScope.LoggedInUserId,
                            Template: record['emailTemplate'],
                            EmailText: record['emailText'],
                            EmailSubject: record['emailSubject'],
                            EmailBody: record['emailBody'],

                            ToAll: record['emailToAll'],
                            ToAllFilter: [{
                                attributeName: "concap_loggedinuser",
                                attributeValue: $rootScope.LoggedInUserId,
                                operator: "Equal",
                                attributeType: "Guid"
                            },
                            {
                                attributeName: "concap_emailoptin",
                                attributeValue: "true",
                                operator: "Equal",
                                attributeType: "boolean"
                            },
                            {
                                attributeName: "statecode",
                                attributeValue: 0,
                                operator: "Equal",
                                attributeType: "int"
                            }]
                        }
                    }).success(function (data, status, headers, config) {
                        d.resolve(data.Data);
                    }).error(function (data, status, headers, config) {
                        d.reject(data.Data);
                    });
                }

                return d;
            };

            factory.previewEmail = function (record) {
                var d = $.Deferred();

                if (record != null) {
                    $http({
                        method: 'POST',
                        url: AppConfig.URL_WEB_API + '/api/email/preview',
                        data: {
                            To: record['emailTo'],
                            FromUserId: $rootScope.LoggedInUserId,
                            Template: record['emailTemplate'],
                            EmailText: record['emailText'],
                            EmailSubject: record['emailSubject'],
                            EmailBody: record['emailBody'],

                            ToAll: record['emailToAll'],
                            ToAllFilter: [{
                                attributeName: "concap_loggedinuser",
                                attributeValue: $rootScope.LoggedInUserId,
                                operator: "Equal",
                                attributeType: "Guid"
                            },
                            {
                                attributeName: "concap_emailoptin",
                                attributeValue: "true",
                                operator: "Equal",
                                attributeType: "boolean"
                            },
                            {
                                attributeName: "statecode",
                                attributeValue: 0,
                                operator: "Equal",
                                attributeType: "int"
                            }]
                        }
                    }).success(function (data, status, headers, config) {
                        d.resolve(data.Data.recordsCollection);
                    }).error(function (data, status, headers, config) {
                        d.reject(data.Data);
                    });
                }

                return d;
            };

            factory.getBinaryData = function (entityName, Id, columnName) {
                var d = $.Deferred();


                $http({
                    method: 'GET',
                    url: AppConfig.URL_WEB_API + '/api/binarydata/' + entityName + '/{' + Id + '}/' + columnName

                }).success(function (data, status, headers, config) {
                    d.resolve(data);
                }).error(function (data, status, headers, config) {
                    d.reject(data);
                });


                return d;
            };

            factory.getAttachment = function (Id) {
                var d = $.Deferred();


                $http({
                    method: 'GET',
                    url: AppConfig.URL_WEB_API + '/api/attachment/{' + Id + '}/' 

                }).success(function (data, status, headers, config) {
                    d.resolve(data, status,headers);
                }).error(function (data, status, headers, config) {
                    d.reject(data);
                });


                return d;
            };

            factory.setEntityState = function (id, logicalName, statecode, statuscode) {
                var d = $.Deferred();

                $http({
                    method: 'POST',
                    url: AppConfig.URL_WEB_API + '/api/entitystatuschange/{' + id + '}/' + logicalName + '/' + statecode + '/' + statuscode + '/'

                }).success(function (data, status, headers, config) {
                    d.resolve(data, status, headers);
                }).error(function (data, status, headers, config) {
                    d.reject(data);
                });


                return d;
            };

            factory.sendEmailUsingSendGrid = function (record) {
                var d = $.Deferred();

                if (record != null) {
                    $http({
                        method: 'POST',
                        url: AppConfig.URL_WEB_API + '/api/email/sendgrid/sendemail',
                        data: {
                            To: record['emailTo'],
                            FromUserId: $rootScope.LoggedInUserId,
                            Template: record['emailTemplate'],
                            EmailText: record['emailText'],
                            EmailSubject: record['emailSubject'],
                            EmailBody: record['emailBody'],
                            ReplyTo: record['replyTo'],
                            CCManager: record['copyToManager'],
                            ToAll: record['emailToAll'],
                            ToAllFilter: [{
                                attributeName: "concap_loggedinuser",
                                attributeValue: $rootScope.LoggedInUserId,
                                operator: "Equal",
                                attributeType: "Guid"
                            },
                            {
                                attributeName: "concap_emailoptin",
                                attributeValue: "true",
                                operator: "Equal",
                                attributeType: "boolean"
                            },
                            {
                                attributeName: "statecode",
                                attributeValue: 0,
                                operator: "Equal",
                                attributeType: "int"
                            }]
                        }
                    }).success(function (data, status, headers, config) {
                        d.resolve(data.Data);
                    }).error(function (data, status, headers, config) {
                        d.reject(data);
                    });
                }

                return d;
            };

            factory.sendContactReassignmentEmail = function (repId, duplicateContactEmail) {
                var d = $.Deferred();
                $http({
                    method: 'POST',
                    url: AppConfig.URL_WEB_API + '/api/email/sendgrid/contactreassignment',
                    data: {
                        "repId": repId,
                        "duplicateContactEmail": duplicateContactEmail
                    }
                }).success(function (data, status, headers, config) {
                    d.resolve(data.Data);
                }).error(function (data, status, headers, config) {
                    d.reject(data);
                    });
                return d;
            };

            return factory;
        }
    ]);