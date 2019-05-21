using System;
using System.ServiceModel.Description;
using System.Web.Configuration;
using Microsoft.Xrm.Sdk.Client;
using log4net;
using Microsoft.Xrm.Tooling.Connector;
using System.Configuration;
using System.Net;

namespace WebAPI.Controllers
{
    public class CrmProxy
    {
        private static readonly ILog log = log4net.LogManager.GetLogger(typeof(CrmProxy));

        private OrganizationServiceProxy _serviceProxy = null;

        public CrmProxy()
        {

        }

        public OrganizationServiceProxy GetCrmProxy()
        {
            try
            {
                log.Info("Entered GetCrmProxy");
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
                var crmConnString = ConfigurationManager.ConnectionStrings["crm"].ConnectionString;
                CrmServiceClient crmService = new CrmServiceClient(crmConnString);
                _serviceProxy = crmService.OrganizationServiceProxy;
                if(_serviceProxy == null)
                {
                    log.Error("CRM Proxy is NULL. Unale to connect to CRM");
                }
                log.Info("Exiting GetCrmProxy");
                return _serviceProxy;
            }
            catch (Exception ex)
            {
                log.Error(ex.Message);
                return null;
            }
        }

    }
}