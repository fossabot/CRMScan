using System;
using System.Diagnostics;
using System.Web.Http;
using System.Web.Mvc;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Client;
using Microsoft.Xrm.Sdk.Query;
using log4net;

namespace WebAPI.Controllers
{
    public class AuthenticationController : ApiController
    {
        private static readonly ILog log = log4net.LogManager.GetLogger(typeof(AuthenticationController));
        private OrganizationServiceProxy _serviceProxy = null;

        public AuthenticationController()
        {
            log.Info("Entering AuthenticationController method");
            
                log.Info("Initialize Service Proxy");
                CrmProxy crmConn = new CrmProxy();
                _serviceProxy = crmConn.GetCrmProxy();
                log.Info("Initialize Service Proxy");
            
            log.Info("Leaving AuthenticationController method");
        }

        [System.Web.Http.HttpPost]
        public JsonResult Authenticate(dynamic data)
        {
            log.Info("Entering Authenticate method");
            var result = new JsonResult();
            result.Data = "false";
            Microsoft.Xrm.Sdk.Query.QueryExpression queryExpression = new Microsoft.Xrm.Sdk.Query.QueryExpression("contact")
            {
                Distinct = true,
                Criteria = new FilterExpression(LogicalOperator.And)
                {
                    Conditions =
                                   {
                                new ConditionExpression("emailaddress1",ConditionOperator.Equal,data.username.Value),
                                new ConditionExpression("concap_password",ConditionOperator.Equal,data.password.Value)
                                   }
                },
                ColumnSet = new ColumnSet(new string[] { "contactid", "fullname", "concap_password" })
            };

            try
            {
                log.Info("Data Retrieval from MSCRM begin");
                EntityCollection contacts = _serviceProxy.RetrieveMultiple(queryExpression);
                log.Debug("Retrieved record count =" + contacts.Entities.Count);
                if (contacts.Entities.Count > 0)
                {
                    Entity contact = contacts.Entities[0];
                    if (contact.GetAttributeValue<String>("concap_password").Equals(data.password.Value))
                    {
                        log.Debug("User logged in : " + contacts.Entities[0].Id);
                        result.Data = contacts.Entities[0];
                    }
                    else
                    {
                        result.Data = null;
                    }
                }
                //                    result.Data = "true";

                else
                {
                    result.Data = null;
                    //                    result.Data = "false";
                }
                log.Info("Data Retrieval from MSCRM end");
            }
            catch (Exception ex)
            {
                log.Error(" Exception occured in Authenticate method ." + ex.Message + ". Returning null");
                return new JsonResult
                {
                    Data = null
                };
            }
            log.Info("leaving Authenticate method");
            return result;
        }
    }
}