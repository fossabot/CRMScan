using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.ServiceModel;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Script.Serialization;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Client;
using Microsoft.Xrm.Sdk.Messages;
using WebAPI.Models;
using WebAPI.Utils;
using log4net;
using Microsoft.Xrm.Sdk.Query;
using System.Web;
using Microsoft.Crm.Sdk.Messages;
using Newtonsoft.Json.Linq;

namespace WebAPI.Controllers
{
    public class EntityApiController : ApiController
    {
        private static readonly ILog log = log4net.LogManager.GetLogger(typeof(EntityApiController));
        private  OrganizationServiceProxy ServiceProxy = null;

        #region Contructor
                
        public EntityApiController()
        {
            log.Info("Entered EntityApiController constructor");
            try
            {

                CrmProxy crmConnection = new CrmProxy();
                ServiceProxy = crmConnection.GetCrmProxy();
                
            }
            catch (FaultException faultException)
            {
                log.Error("Error in EmailController constructor " + faultException.Message);
                throw new FaultException(" ==An Error Occured in retrieving the Organization Proxy== " +
                                         faultException.Message);
            }
            log.Info("Exiting EntityApiController constructor");
        }

        #endregion

        #region Private Methods
        
        private List<KeyValuePair<string, string>> RequestParameters { get; set; }

        private ODataQuery GetODataQueryObject(HttpRequestMessage request, string queryString)
        {
            
            var odataQuery = HttpRequestMessageExtensions.GetQueryString(Request, queryString);
            var sr = new JavaScriptSerializer();
            var odataQueryObject = sr.Deserialize<ODataQuery>(odataQuery);
            return odataQueryObject;
        }

        private PortalEntity GetPortalEntityObject(HttpRequestMessage request, string queryString)
        {
            string odataQuery = HttpRequestMessageExtensions.GetQueryString(Request, queryString);
            var sr = new JavaScriptSerializer();
            var portalEntityObject = sr.Deserialize<PortalEntity>(odataQuery);
            return portalEntityObject;
        }

        private static Entity GetCrmEntity(PortalEntity entityInstance, string entityName)
        {
            Entity crmEntityInstance = new Entity(entityName);
            foreach (var portalAttribute in entityInstance.PortalAttributes)
            {
                if (!portalAttribute.Key.ToLower().Contains("isopen"))
                {
                    string columnType = GetColumnType(portalAttribute.Key, entityInstance.Columns);
                    if (!String.IsNullOrEmpty(columnType))
                    {
                        if (columnType == "picklist")
                        {
                            var obj = (JObject)portalAttribute.Value;
                            if (obj != null)
                            {
                                //var value = obj.Properties().Select(p => p.Value).FirstOrDefault();
                                var value = ((dynamic)portalAttribute.Value).Value.Value;
                                if (value != null && value.ToString() != null && !value.ToString().Equals(""))
                                {
                                    int picklistValue = Int32.Parse(value.ToString());
                                    crmEntityInstance.Attributes.Add(portalAttribute.Key, new OptionSetValue(picklistValue));
                                }
                                else
                                {
                                    crmEntityInstance.Attributes.Add(portalAttribute.Key, null);
                                }
                            }
                            else
                            {
                                crmEntityInstance.Attributes.Add(portalAttribute.Key, null);
                            }
                        }
                        else if (columnType == "boolean")
                        {
                            bool booleanValue;
                            if (bool.TryParse(portalAttribute.Value.ToString(), out booleanValue))
                            {
                                booleanValue = Convert.ToBoolean(portalAttribute.Value.ToString());
                            }
                            else
                            {
                                var str = ((JObject)portalAttribute.Value).Properties().Where(p => p.Value.Path.Equals("Value")).FirstOrDefault().Value.Value<String>();
                                booleanValue = bool.Parse(str);
                            }
                            crmEntityInstance.Attributes.Add(portalAttribute.Key, booleanValue);
                        }
                        else if (columnType == "wholenumber")
                        {
                            int wholeNumberValue = Int32.Parse(portalAttribute.Value.ToString());
                            crmEntityInstance.Attributes.Add(portalAttribute.Key, wholeNumberValue);
                        }
                        else if (columnType == "datetime")
                        {
                            DateTime dateTimeValue = DateTime.Parse(portalAttribute.Value.ToString());
                            crmEntityInstance.Attributes.Add(portalAttribute.Key, dateTimeValue);
                        }
                        else if (columnType == "money")
                        {
                            var str = ((JObject)portalAttribute.Value).Properties().Where(p => p.Value.Path.Equals("Value")).FirstOrDefault().Value.Value<String>();
                        //    Dictionary<string, object> portalAttributeValue = (Dictionary<string, object>)portalAttribute.Value;
                            decimal moneyDecimal = Decimal.Parse(str);
                            crmEntityInstance.Attributes.Add(portalAttribute.Key, new Money(moneyDecimal));
                        }
                        else if (columnType == "lookup" || columnType == "lookup-hidden")
                        {
                            var jobj = (JObject)portalAttribute.Value;
                            IEnumerable<JProperty> props = jobj.Properties();
                            var id = new Guid();
                            string logicalName = null;
                            foreach (var prop in props)
                            {
                                if (prop.Name == "Id")
                                {
                                    id = new Guid(prop.Value.Value<String>());
                                }
                                else if (prop.Name == "LogicalName")
                                {
                                    logicalName = prop.Value.Value<String>();
                                }
                            }
                            crmEntityInstance.Attributes.Add(portalAttribute.Key, new EntityReference(logicalName, id));

                        }
                        else if (columnType == "label")
                        {
                            //Skip
                        }
                        else
                        {
                            crmEntityInstance.Attributes.Add(portalAttribute.Key, portalAttribute.Value);
                        }
                    }
                }
            }
            //if (entityInstance.Id != Guid.Empty)
            //{
            //    crmEntityInstance.Id = entityInstance.Id;
            //}
            return crmEntityInstance;
        }

        private static string GetColumnType(string columnName, List<Column> columnArray)
        {
            if (columnArray != null)
            {
                foreach (var column in columnArray)
                {
                    if (column.dataDefAttr == columnName)
                        return column.type;
                }
                return String.Empty;
            }
            return String.Empty;
        }

        private ResultSet GetResultSet(RetrieveMultipleResponse retrieveMultipleResponse)
        {
            IList<IDictionary<string, object>> recordsCollection = new List<IDictionary<string, object>>();
            // const string moneyType = "Money";
            bool hasMoreRecords = retrieveMultipleResponse.EntityCollection.MoreRecords;
            foreach (var entity in retrieveMultipleResponse.EntityCollection.Entities)
            {
                IDictionary<string, object> attributesCollection = new Dictionary<string, object>();
                foreach (var attribute in entity.Attributes)
                {
                    var columnMetaData = new ColumnMetaData();
                    if (attribute.Value != null)
                    {
                        columnMetaData.__metadata = new MetaData();
                        if (attribute.Value is EntityReference)
                        {
                            columnMetaData.__metadata.type = typeof(EntityReference).ToString();
                        }

                        else if (attribute.Value is Money)
                        {
                            columnMetaData.__metadata.type = typeof(Money).ToString();
                        }

                        string attributeKey = attribute.Key;
                        object attributeValue = attribute.Value;
                        attributesCollection.Add(attributeKey, attributeValue);
                    }
                }
                attributesCollection.Add("isOpen", false);
                recordsCollection.Add(attributesCollection);
            }
            var resultSet = new ResultSet
            {
                HasMoreRecords = hasMoreRecords,
                recordsCollection = recordsCollection
            };
            return resultSet;
        }

        private ResultSet GetResultSet(EntityCollection entities)
        {
            IList<IDictionary<string, object>> recordsCollection = new List<IDictionary<string, object>>();
            bool hasMoreRecords = entities.MoreRecords;
            foreach (var entity in entities.Entities)
            {
                IDictionary<string, object> attributesCollection = new Dictionary<string, object>();
                foreach (var attribute in entity.Attributes)
                {
                    var columnMetaData = new ColumnMetaData();
                    if (attribute.Value != null)
                    {
                        
                        string attributeKey = attribute.Key;
                        object attributeValue = attribute.Value;
                        attributesCollection.Add(attributeKey, attributeValue);
                    }
                }
                recordsCollection.Add(attributesCollection);
            }
            var resultSet = new ResultSet
            {
                HasMoreRecords = hasMoreRecords,
                recordsCollection = recordsCollection,
                PagingCookie = entities.PagingCookie
            };
            return resultSet;
        }

        private bool ValidateDuplicateContact(PortalEntity portalEntity)
        {
            bool duplicate = false;

            if (portalEntity.entityName.ToLower() == "contact")
            {
                string emailFieldName = "emailaddress1";
                string emailAddress = string.Empty;
                if(portalEntity.PortalAttributes.ContainsKey(emailFieldName) && portalEntity.PortalAttributes[emailFieldName] != null)
                {
                    emailAddress = portalEntity.PortalAttributes[emailFieldName].ToString();
                }

                if (!string.IsNullOrEmpty(emailAddress))
                {
                    log.Info("New Contact Email " + emailAddress);
                    string fetchXml = @"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
                                      <entity name='contact'>
                                        <attribute name='fullname' />
                                        <order attribute='fullname' descending='false' />
                                        <filter type='and'>
                                          <condition attribute='" + emailFieldName + @"' operator='eq' value='" + emailAddress + @"' />
                                          <condition attribute='statecode' operator='eq' value='0' />
                                          <filter type='or'>
                                            <condition attribute='concap_appuser' operator='eq' value='1' />
                                            <condition attribute='concap_createdfromapp' operator='eq' value='1' />
                                          </filter>                                          
                                        </filter>
                                      </entity>
                                    </fetch>";
                    EntityCollection dupCotactColl = ServiceProxy.RetrieveMultiple(new FetchExpression(fetchXml));
                    if(dupCotactColl.Entities.Count> 0)
                    {
                        duplicate = true;
                    }

                }
            }

            return duplicate;
        }

        #endregion

        #region Public Methods


        [System.Web.Http.HttpGet]
        public JsonResult RetrieveMultipleEntities([FromUri]ODataQuery oDataQuery)
        {
            log.Info("Entered RetrieveMultipleEntities ");
            ODataQuery odataQueryObject = GetODataQueryObject(Request, "ODataQuery");
            try
            {
                RetrieveMultipleResponse retrieveMultipleResponse = EntityApiUtils.RetrieveEntities(ServiceProxy,
                    odataQueryObject);

                ResultSet resultSet = GetResultSet(retrieveMultipleResponse);
                log.Info("Exiting RetrieveMultipleEntities ");
                return new JsonResult
                {
                    Data = resultSet,
                    JsonRequestBehavior = JsonRequestBehavior.AllowGet
                };
            }
            catch (Exception e)
            {
                log.Info("Exiting RetrieveMultipleEntities with message ");
                return new JsonResult
                {
                    Data = e.Message
                };
            }
        }

        [System.Web.Http.HttpPost]
        public JsonResult CreateEntity(string createEntityName, PortalEntity portalEntity)
        {
            try
            {
                log.Info("Entered CreateEntity");
                if (ValidateDuplicateContact(portalEntity) == false)
                {
                    Entity createEntity = GetCrmEntity(portalEntity, createEntityName);
                    Guid Id = ServiceProxy.Create(createEntity);
                    log.Info("Exiting CreateEntity ");
                    return new JsonResult() { Data = Id };
                }
                else
                {
                    log.Error("Duplicate contact with email address found!");
                    throw new Exception("Duplicate Record");
                }
            }           
            catch(Exception ex)
            {
                log.Error(ex);
                throw new Exception(ex.Message);
            }

        }

        [System.Web.Http.HttpPost]
        public void UpdateEntity(string id, string entityName, PortalEntity updateEntity)
        {
            log.Info("Entered UpdateEntity ");

            Entity entity = GetCrmEntity(updateEntity, entityName);
            Guid primaryKey = Guid.Parse(id);
            entity.Id = primaryKey;
            ServiceProxy.Update(entity);
            log.Info("Exiting UpdateEntity ");

        }

        [System.Web.Http.HttpGet]
        [System.Web.Http.Route("api/binarydata/{entityName}/{entityId}/{binaryColumnName}")]
        public string GetBinaryData(string entityName, Guid entityId, string binaryColumnName)
        {
            
            Entity binaryDataEntity = ServiceProxy.Retrieve(entityName, entityId, new ColumnSet(new string[] { binaryColumnName }));

            byte[] imageBytes = null;
            string base64 = "";
            if (binaryDataEntity.Contains(binaryColumnName))
            {
                if (binaryDataEntity[binaryColumnName] is byte[])
                {
                    imageBytes = binaryDataEntity[binaryColumnName] as byte[];
                    base64 = Convert.ToBase64String(imageBytes);
                }
                else
                {
                    base64 = binaryDataEntity[binaryColumnName].ToString();
                }
                
            }
            return base64;
           
        }

        [System.Web.Http.HttpGet]
        [System.Web.Http.Route("api/attachment/{entityId}")]
        public Entity GetAttachment(Guid entityId)
        {

            Entity note = ServiceProxy.Retrieve("annotation", entityId, new ColumnSet(new string[] { "filename","documentbody","mimetype" }));

            return note;

        }

        [System.Web.Http.HttpPost]
        public string CreateAttachment(string objectId, string entityLogicalName, string fileName)
        {

            Guid recordId = Guid.Empty;
            if (!string.IsNullOrEmpty(objectId))
            {
                if (Guid.TryParse(objectId, out recordId))
                {
                    recordId = Guid.Parse(objectId);
                }
            }


            Guid annotationId = Guid.Empty;
            try
            {
                
                var httpPostedFile = HttpContext.Current.Request.Files["myFile"];
                if (httpPostedFile != null)
                {
                    int iFileLength = httpPostedFile.ContentLength;
                    Byte[] inputBuffer = new Byte[iFileLength];
                    System.IO.Stream inputStream;
                    inputStream = httpPostedFile.InputStream;
                    inputStream.Read(inputBuffer, 0, iFileLength);

                    if (string.IsNullOrEmpty(fileName))
                    {
                        fileName = httpPostedFile.FileName;
                    }

                    Entity annotationEntity = new Entity("annotation");
                    annotationEntity.Attributes.Add("filename", fileName);
                    annotationEntity.Attributes.Add("mimetype", httpPostedFile.ContentType);
                    annotationEntity.Attributes.Add("documentbody", Convert.ToBase64String(inputBuffer.ToArray()));
                    if (recordId != Guid.Empty)
                    {
                        annotationEntity.Attributes.Add("objectid", new EntityReference(entityLogicalName, recordId));
                    }
                    Guid noteId = ServiceProxy.Create(annotationEntity);

                    return fileName;
                }
               
            }
            catch (FaultException faultException)
            {
                log.Debug(" An Error Occured in CreateAttachment method " + faultException.Message);                
                return faultException.Message;
            }
            return String.Empty;
        }

        [System.Web.Http.HttpPost]
        [System.Web.Http.Route("api/setentityimage/{objectId}/{entityLogicalName}")]
        public bool SetEntityImage(string objectId, string entityLogicalName)
        {

            Guid recordId = Guid.Empty;
            if (!string.IsNullOrEmpty(objectId))
            {
                if (Guid.TryParse(objectId, out recordId))
                {
                    recordId = Guid.Parse(objectId);
                }
            }


            
            try
            {

                var httpPostedFile = HttpContext.Current.Request.Files["myFile"];
                if (httpPostedFile != null)
                {
                    int iFileLength = httpPostedFile.ContentLength;
                    Byte[] inputBuffer = new Byte[iFileLength];
                    System.IO.Stream inputStream;
                    inputStream = httpPostedFile.InputStream;
                    inputStream.Read(inputBuffer, 0, iFileLength);


                    Entity entity = new Entity(entityLogicalName);
                    entity.Attributes.Add("entityimage", inputBuffer);
                    if (recordId != Guid.Empty)
                    {
                        entity.Id = recordId;
                        ServiceProxy.Update(entity);
                        return true;
                    }

                    
                }

            }
            catch (FaultException faultException)
            {
                log.Debug(" An Error Occured in CreateAttachment method " + faultException.Message);
                return false;
            }
            return false;
        }

        [System.Web.Http.HttpGet]
        [System.Web.Http.Route("api/crm/executefetchxml")]
        public JsonResult ExecuteFetchXml(string fetchXml)
        {
            try
            {
                EntityCollection responseEntities = ServiceProxy.RetrieveMultiple(new FetchExpression(fetchXml));
                ResultSet result = GetResultSet(responseEntities);

                return new JsonResult
                {
                    Data = result,
                    JsonRequestBehavior = JsonRequestBehavior.AllowGet
                };
            }
            catch (Exception e)
            {
                log.Error("Exiting ExecuteFetchXml with message " + e.Message);
                return new JsonResult
                {
                    Data = e.Message
                };
            }
        }

        [System.Web.Http.HttpPost]
        [System.Web.Http.Route("api/entitystatuschange/{entityid}/{logicalName}/{statecode}/{statuscode}")]
        public JsonResult EntityStatusChange(string entityid, string logicalName, int statecode,int statuscode)
        {
            Guid recordId = Guid.Empty;
            if (!string.IsNullOrEmpty(entityid))
            {
                if (Guid.TryParse(entityid, out recordId))
                {
                    recordId = Guid.Parse(entityid);
                }
            }
            SetStateRequest state = new SetStateRequest();
            state.State = new OptionSetValue(statecode);
            state.Status = new OptionSetValue(statuscode);
            state.EntityMoniker = new EntityReference(logicalName, recordId);

            // Execute the Request
            SetStateResponse stateSet = (SetStateResponse)ServiceProxy.Execute(state);
            return new JsonResult
            {
                Data = stateSet
            };
        }
        #endregion

    }
}