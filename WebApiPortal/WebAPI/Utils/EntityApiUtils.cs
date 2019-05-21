using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Client;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;
using WebAPI.Models;
using log4net;

namespace WebAPI.Utils
{
    public class EntityApiUtils
    {
        private static readonly ILog log = log4net.LogManager.GetLogger(typeof(EntityApiUtils));

        public static RetrieveMultipleResponse RetrieveEntities(OrganizationServiceProxy serviceProxy, ODataQuery odataQueryObject)
        {
            log.Info("Entered RetrieveEntities");

            QueryExpression queryExpression = GetQueryExpression(odataQueryObject);
            var multipleRequest = new RetrieveMultipleRequest { Query = queryExpression };
            try
            {
                RetrieveMultipleResponse result = (RetrieveMultipleResponse)serviceProxy.Execute(multipleRequest);
                log.Info("Exiting RetrieveEntities");
                return result;
            }
            catch (FaultException<OrganizationServiceFault> fault)
            {
                log.Error("RetrieveEntities : An Exception Occured ==" + fault.Message);
                throw new Exception("==An Exception Occured ==" + fault.Message);
            }

        }

        public static Guid CreateLog(OrganizationServiceProxy crmService,string name, string message)
        {
            Entity ccLog = new Entity("concap_hdcapplog");
            ccLog.Attributes.Add("concap_name", name);
            ccLog.Attributes.Add("concap_message", message);
            return crmService.Create(ccLog);
        }
        public static Guid CreateLog(OrganizationServiceProxy crmService, EntityReference rep, string name, string message)
        {
            Entity ccLog = new Entity("concap_hdcapplog");
            ccLog.Attributes.Add("concap_name", name);
            ccLog.Attributes.Add("concap_message", message);
            ccLog.Attributes.Add("concap_rep", rep);
            return crmService.Create(ccLog);
        }
        public static Guid CreateLog(OrganizationServiceProxy crmService, EntityReference rep, EntityReference sendToContact, string name, string message)
        {
            Entity ccLog = new Entity("concap_hdcapplog");
            ccLog.Attributes.Add("concap_name", name);
            ccLog.Attributes.Add("concap_message", message);
            ccLog.Attributes.Add("concap_rep", rep);
            ccLog.Attributes.Add("concap_sendtocontact", sendToContact);
            return crmService.Create(ccLog);
        }

        public static Entity ReadContactByEmail(OrganizationServiceProxy service, string email, ColumnSet columns)
        {
            QueryExpression query = new QueryExpression("contact");
            query.Criteria = new FilterExpression(LogicalOperator.And);
            query.Criteria.AddCondition("emailaddress1", ConditionOperator.Equal, email);
            query.ColumnSet = columns;
            LinkEntity storeLink = new LinkEntity("contact", "concap_store", "concap_primarystorenumber", "concap_storeid", JoinOperator.LeftOuter);
            storeLink.Columns = new ColumnSet(new string[] { "concap_name", "concap_city", "concap_stateprovince" });
            storeLink.EntityAlias = "store";
            query.LinkEntities.Add(storeLink);

            LinkEntity managerLink = new LinkEntity("contact", "concap_hdcmanager", "concap_hdcmanagerid", "concap_hdcmanagerid", JoinOperator.LeftOuter);
            managerLink.Columns = new ColumnSet(new string[] { "concap_name", "emailaddress" });
            managerLink.EntityAlias = "manager";
            query.LinkEntities.Add(managerLink);

            EntityCollection contactcoll = service.RetrieveMultiple(query);
            if (contactcoll.Entities.Count > 0)
            {
                return contactcoll.Entities[0];
            }
            else return null;
        }

        public static Entity ReadContactById(OrganizationServiceProxy service, Guid id, ColumnSet columns)
        {
            QueryExpression query = new QueryExpression("contact");
            query.Criteria = new FilterExpression(LogicalOperator.And);
            query.Criteria.AddCondition("contactid", ConditionOperator.Equal, id);
            query.ColumnSet = columns;
            LinkEntity storeLink = new LinkEntity("contact", "concap_store", "concap_primarystorenumber", "concap_storeid", JoinOperator.LeftOuter);
            storeLink.Columns = new ColumnSet(new string[] { "concap_name", "concap_city", "concap_stateprovince" });
            storeLink.EntityAlias = "store";
            query.LinkEntities.Add(storeLink);

            LinkEntity managerLink = new LinkEntity("contact", "concap_hdcmanager", "concap_hdcmanagerid", "concap_hdcmanagerid", JoinOperator.LeftOuter);
            managerLink.Columns = new ColumnSet(new string[] { "concap_name", "emailaddress" });
            managerLink.EntityAlias = "manager";
            query.LinkEntities.Add(managerLink);

            EntityCollection contactcoll = service.RetrieveMultiple(query);
            if (contactcoll.Entities.Count > 0)
            {
                return contactcoll.Entities[0];
            }
            else return null;
        }

        public static EntityCollection ExecuteFetchXml(IOrganizationService service, string fetchXml)
        {
            return service.RetrieveMultiple(new FetchExpression(fetchXml));
        }

        public static string GetStringValue(Entity record, string attributeName)
        {
            string value = string.Empty;
            if (record != null && record.Contains(attributeName))
            {
                if(record[attributeName] is AliasedValue)
                {
                    if (((AliasedValue)record[attributeName]).Value != null)
                        value = ((AliasedValue)record[attributeName]).Value.ToString();
                }
                else
                {
                    value = record[attributeName].ToString();
                }
            }

            return value;
        }

        private static QueryExpression GetQueryExpression(ODataQuery odataQueryObject)
        {
            log.Info("Entered GetQueryExpression");
            var filterExpression = new FilterExpression { FilterOperator = LogicalOperator.And };
            if (odataQueryObject.FilterConditions != null)
            {
                foreach (FilterCondition filterCondition in odataQueryObject.FilterConditions)
                {
                    if (filterCondition.attributeName != null && filterCondition.attributeValue != null)
                    {
                        var condition = new ConditionExpression
                        {
                            AttributeName = filterCondition.attributeName
                        };
                        if (filterCondition.attributeType != null)
                        {
                            string attributeType = filterCondition.attributeType;
                            if (attributeType == "Guid")
                            {
                                Guid filterGuid;
                                if (Guid.TryParse(filterCondition.attributeValue.ToString(), out filterGuid))
                                {
                                    filterGuid = Guid.Parse(filterCondition.attributeValue.ToString());
                                    if (filterGuid != Guid.Empty)
                                        condition.Values.Add(filterGuid);
                                }
                            }
                            else if (attributeType == "entityname")
                            {
                                condition.Values.Add(filterCondition.attributeValue);
                            }
                            else if (attributeType == "picklist")
                            {
                                int value;
                                //((System.Collections.Generic.Dictionary<string, object>)filterCondition.attributeValue).TryGetValue("Value", out value);                                
                                //if (value != null && !value.ToString().Trim().Equals(""))
                                //{
                                //    condition.Values.Add(value);
                                //}
                                if (int.TryParse(filterCondition.attributeValue.ToString(), out value))
                                {
                                    value = int.Parse(filterCondition.attributeValue.ToString());
                                    condition.Values.Add(value);
                                }
                            }
                            else if (attributeType == "boolean")
                            {
                                bool value;
                                if(bool.TryParse( filterCondition.attributeValue.ToString(), out value)){
                                    value = bool.Parse(filterCondition.attributeValue.ToString());
                                    condition.Values.Add(value);
                                }
                                
                            }
                            else if (attributeType == "int")
                            {
                                int value;
                                if (int.TryParse(filterCondition.attributeValue.ToString(), out value))
                                {
                                    value = int.Parse(filterCondition.attributeValue.ToString());
                                    condition.Values.Add(value);
                                }
                            }
                            else
                            {
                                string aCondition = filterCondition.attributeValue as String;
                                if (aCondition == null)
                                {
                                    aCondition = filterCondition.attributeValue.ToString();
                                }

                                if (filterCondition.Operator == "Like")
                                {
                                    aCondition = aCondition.Replace("%", "[%]");
                                    condition.Values.Add("%" + (aCondition) + "%");
                                }
                                else
                                {
                                    //condition.Values.Add("%" + (filterCondition.attributeValue) + "%");
                                    condition.Values.Add(aCondition);
                                }

                            }
                        }
                        if (condition.Values.Count > 0)
                        {
                            ConditionOperator conditionOperator = GetConditionOperator(filterCondition.Operator);
                            condition.Operator = conditionOperator;
                            filterExpression.AddCondition(condition);
                        }
                    }
                }
            }


            var queryExpression = new QueryExpression
            {
                EntityName = odataQueryObject.EntityName,
                ColumnSet =
                    odataQueryObject.Columns != null
                        ? new ColumnSet(odataQueryObject.Columns)
                        : new ColumnSet(true),
                Criteria = filterExpression,
            };

            if (odataQueryObject.OrderByClauses != null)
            {
                foreach (OrderByClause orderByClause in odataQueryObject.OrderByClauses)
                {
                    if (orderByClause.expression != null)
                    {
                        OrderType orderType = orderByClause.orderBy == OrderBy.ASC ? OrderType.Ascending : OrderType.Descending;
                        queryExpression.AddOrder(orderByClause.expression, orderType);
                    }
                }
            }
            if (odataQueryObject.PagingInfo != null)
            {
                var pageInfo = new PagingInfo
                {
                    PageNumber = odataQueryObject.PagingInfo.PageNumber,
                    PagingCookie = null,
                    Count = odataQueryObject.PagingInfo.Count
                };
                queryExpression.PageInfo = pageInfo;
            }
            log.Info("Exiting GetQueryExpression");
            return queryExpression;
        }

        private static ConditionOperator GetConditionOperator(string operatorValue)
        {
            switch (operatorValue)
            {
                case "Equal":
                    return ConditionOperator.Equal;
                case "Like":
                    return ConditionOperator.Like;
                case "Contains":
                    return ConditionOperator.Contains;
                case "StartsWith":
                    return ConditionOperator.BeginsWith;
                default:
                    return ConditionOperator.Equal;
            }
        }
    }
}