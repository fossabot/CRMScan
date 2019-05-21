using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.ServiceModel;
using System.Web.Http;
using System.Web.Mvc;
using System.Xml.Serialization;
using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Client;
using Newtonsoft.Json.Linq;
using WebAPI.Models;
using WebAPI.Utils;
using log4net;
using SendGrid;
using SendGrid.Helpers.Mail;
using System.Threading.Tasks;
using System.Web.Configuration;
using System.Configuration;

namespace WebAPI.Controllers
{
    //[System.Web.Http.RoutePrefix("api/email")]
    public class EmailController : ApiController
    {
        private static readonly ILog log = log4net.LogManager.GetLogger(typeof(EmailController));
        private OrganizationServiceProxy ServiceProxy = null;

        public EmailController()
        {
            log.Info("Entered EmailController constructor");
            try
            {
                var crmConn = new CrmProxy();
                ServiceProxy = crmConn.GetCrmProxy();
            }
            catch (FaultException faultException)
            {
                log.Error("Error in EmailController constructor " + faultException.Message);
                throw new FaultException(" ==An Error Occured in retrieving the Organization Proxy== " +
                                         faultException.Message);
            }
            log.Info("Exiting EmailController constructor");
        }

        #region Public Methods


        [System.Web.Http.HttpPost]
        [System.Web.Http.Route("api/email/sendgrid/sendemail")]
        public JsonResult SendEmailUsingSendGrid(EmailEntity emailEntity)
        {
            log.Info("Entered SendEmailUsingSendGrid");
            #region Bcc

            var activityPartyBccColl = new EntityCollection();
            if (emailEntity.ToAll)
            {
                log.Info("Send to ALL");
                PopulateAllContactsFromFilter(emailEntity, activityPartyBccColl);
            }
            else
            {
                log.Info("Send to specific contacts");
                activityPartyBccColl = PopulateContactsProvided(emailEntity, activityPartyBccColl);
            }
            #endregion

            Entity rep = ServiceProxy.Retrieve("contact", emailEntity.FromUserId, new ColumnSet(true));

            #region From

            var fromEmailAddress = GetContactEmail(rep);
            var email_FromColl = GetEmailFrom(rep);

            #endregion

            #region CC
            List<string> ccEmails = new List<string>();
            ccEmails.Add(fromEmailAddress);

            EntityCollection ccColl = GetEmailCcCollection(rep, emailEntity);
            string managerEmail = GetManagerEmail(rep);
            if (emailEntity.CCManager == true && !string.IsNullOrEmpty(managerEmail))
            {
                ccEmails.Add(managerEmail);
            }
            #endregion

            var jobjTemplate = (JObject)emailEntity.Template;
            string strTemplateId = null;
            if (jobjTemplate != null)
            {
                strTemplateId = getPropertyValue(jobjTemplate, "Id");
            }
            var emailId = Guid.Empty;
            if (!string.IsNullOrEmpty(strTemplateId))
            {
                log.Info("With email template");
                int count = 1;
                foreach (var toContact in activityPartyBccColl.Entities)
                {
                    log.Info("Contact order :" + count);
                    try
                    {
                        var activityPartyToColl = GetEmailTo(toContact);
                                                                    
                        var toId = ((EntityReference)toContact["partyid"]).Id;                        

                        string emailaddress = GetContactEmail(ServiceProxy, toId);

                        //MTCCA-174.
                        log.Info("Updating personal notes...");
                        UpdateContactWithPersonalNotes(emailEntity.EmailText, emailEntity.EmailSubject, emailEntity.EmailBody, toId);

                        log.Info("Getting template");
                        Entity templateEmail = GetEmailByTemplate(strTemplateId, toContact);

                        #region Attachments

                        log.Info("Getting attachments");
                        EntityCollection attachmentsColl = GetTemplateAttachments(Guid.Parse(strTemplateId));
                        List<Attachment> attachments = new List<Attachment>();
                        if (attachmentsColl.Entities.Count > 0)
                        {
                            log.Debug(attachmentsColl.Entities.Count + " attachments");
                            foreach (Entity templAtt in attachmentsColl.Entities)
                            {
                                if (templAtt.Contains("body") && templAtt["body"] != null)
                                {
                                    Attachment att = new Attachment();

                                    att.Content = templAtt["body"].ToString();

                                    if (templAtt.Contains("filename") && templAtt["filename"] != null)
                                    {
                                        att.Filename = templAtt["filename"].ToString();
                                    }
                                    if (templAtt.Contains("mimetype") && templAtt["mimetype"] != null)
                                    {
                                        att.Type = templAtt["mimetype"].ToString();
                                    }

                                    attachments.Add(att);
                                }
                                else
                                {
                                    log.Warn("Attachments content is empty");
                                }
                            }
                        }
                        #endregion

                        log.Info("Creating email in CRM");
                        emailId = CreateEmailInCrm(templateEmail["subject"].ToString(), emailEntity.FromUserId, activityPartyToColl, email_FromColl, ccColl);                        
                        log.Info("email record id: " + emailId);
                        templateEmail.Id = emailId;

                        //AddAttachmentsToEmail(templateEmail, attachmentsColl);

                        log.Info("Sending email using sendgrid...");
                        var task = SendEmailAsync(fromEmailAddress, emailaddress, ccEmails, emailEntity.ReplyTo, templateEmail["subject"].ToString(),
                            templateEmail["description"].ToString(), attachments);
                        log.Info("Email sent");

                    }
                    catch (Exception ex)
                    {
                        log.Error("Error sending email, Count " + count);
                        log.Error(ex);
                    }
                    count++;
                }
            }

            log.Info("Exiting SendGridEmail ");

            return new JsonResult() { Data = "Sent" };
        }

        [System.Web.Http.HttpPost]
        [System.Web.Http.Route("api/email/sendgrid/contactreassignment")]
        public JsonResult ContactReassignmentEmail(dynamic data)
        {
            log.Info("DuplicateContactEmailToSupport");

            string hdcSupportEmail = ConfigurationManager.AppSettings["HDCSupportEmail"];
            ColumnSet columns = new ColumnSet();
            columns.AddColumns(new string[] { "firstname", "lastname", "emailaddress1", "concap_loggedinuser" });
            Entity duplicateContact = EntityApiUtils.ReadContactByEmail(ServiceProxy, data.duplicateContactEmail.Value, columns);
            Entity rep = EntityApiUtils.ReadContactById(ServiceProxy, Guid.Parse(data.repId.Value), new ColumnSet(true));
            Entity owningRep = null;

            string contactFirstName = EntityApiUtils.GetStringValue(duplicateContact, "firstname");
            string contactLastName = EntityApiUtils.GetStringValue(duplicateContact, "lastname");
            string submitedRepName = EntityApiUtils.GetStringValue(rep, "fullname");
            string owningRepName = "";
            string repEmail = EntityApiUtils.GetStringValue(rep, "emailaddress1");

            if (duplicateContact.Contains("concap_loggedinuser"))
            {
                owningRepName = ((EntityReference)duplicateContact["concap_loggedinuser"]).Name;
                owningRep = EntityApiUtils.ReadContactById(ServiceProxy, ((EntityReference)duplicateContact["concap_loggedinuser"]).Id, new ColumnSet(true));
            }
                      
            string emailDescription = "<p>HDC App Admin,</p>";
            emailDescription += "<p>I am requesting that the contact below gets reassigned to me:</p>";
            emailDescription += "<ul><li>" + contactFirstName + " " + contactLastName + "</li>";
            emailDescription += "<li>" + data.duplicateContactEmail.Value + "</li></ul>";
            emailDescription += "<p>Please contact me for details.</p>";

            emailDescription += "<p><strong>TTI Rep requesting contact reassignment: </strong></p>";
            emailDescription += "<ul><li>" + submitedRepName + "</li>";
            emailDescription += "<li>" + EntityApiUtils.GetStringValue(rep, "store.concap_name")+", "+ EntityApiUtils.GetStringValue(rep, "store.concap_city") +", "+ EntityApiUtils.GetStringValue(rep, "store.concap_stateprovince") + "</li>";
            emailDescription += "<li>" + EntityApiUtils.GetStringValue(rep, "telephone1") + "</li>";
            emailDescription += "<li>" + EntityApiUtils.GetStringValue(rep, "emailaddress1") + "</li></ul>";

            emailDescription += "<p><strong>TTI Rep who owns existing contact: </strong></p>";
            emailDescription += "<ul><li>" + owningRepName + "</li>";
            emailDescription += "<li>" + EntityApiUtils.GetStringValue(owningRep, "store.concap_name") + ", " + EntityApiUtils.GetStringValue(rep, "store.concap_city") + ", " + EntityApiUtils.GetStringValue(rep, "store.concap_stateprovince") + "</li>";
            emailDescription += "<li>" + EntityApiUtils.GetStringValue(owningRep, "telephone1") + "</li>";
            emailDescription += "<li>" + EntityApiUtils.GetStringValue(owningRep, "emailaddress1") + "</li></ul>";

            emailDescription += "<p><strong>TTI Manager of existing contact owner: </strong></p>";
            emailDescription += "<ul><li>" + EntityApiUtils.GetStringValue(owningRep, "manager.concap_name") + "</li>";
            emailDescription += "<li>" + EntityApiUtils.GetStringValue(owningRep, "manager.emailaddress") + "</li></ul>";

            log.Info("Sending reassignment email...");
            var task = SendEmailAsync(repEmail, hdcSupportEmail, repEmail, "HDC Contact Reassignment Request", emailDescription, null);
            return new JsonResult() { Data = "An email has been submitted for contact reassignment.  An Administrator will be in contact with you regarding this request" };
        }

        [System.Web.Http.HttpPost]
        public JsonResult SendEmail(EmailEntity emailEntity)
        {
            var emailId = Guid.Empty;
            log.Info("Entered SendEmail constructor");
            try
            {
                var activityPartyBccColl = new EntityCollection();
                if (emailEntity.ToAll)
                {
                    log.Info("Send to ALL");
                    PopulateAllContactsFromFilter(emailEntity, activityPartyBccColl);
                }
                else
                {
                    log.Info("Send to specific contacts");
                    activityPartyBccColl = PopulateContactsProvided(emailEntity, activityPartyBccColl);
                }

                var fromQueueId = RetrieveFromQueue(emailEntity);

                var activityPartyFrom = new Entity("activityparty");
                activityPartyFrom.Attributes.Add("partyid", new EntityReference("queue", fromQueueId));

                var activityPartyFromColl = new EntityCollection();
                activityPartyFromColl.Entities.Add(activityPartyFrom);

                var jobjTemplate = (JObject)emailEntity.Template;
                string strTemplateId = null;
                if (jobjTemplate != null)
                {
                    strTemplateId = getPropertyValue(jobjTemplate, "Id");
                }

                if (!string.IsNullOrEmpty(strTemplateId))
                {
                    #region With Template

                    log.Info("With email template");
                    int count = 1;
                    foreach (var toContact in activityPartyBccColl.Entities)
                    {
                        log.Info("Contact order :" + count);
                        try
                        {
                            var activityPartyToColl = new EntityCollection();
                            var activityPartyTo = new Entity("activityparty");
                            var toId = ((EntityReference)toContact["partyid"]).Id;
                            activityPartyTo.Attributes.Add("partyid", new EntityReference("contact", toId));
                            activityPartyToColl.Entities.Add(activityPartyTo);

                            var emailText = emailEntity.EmailText;
                            //MTCCA-174.
                            log.Info("Updating personal notes...");
                            UpdateContactWithPersonalNotes(emailText, emailEntity.EmailSubject, emailEntity.EmailBody, toId);

                            log.Info("creating email with attachment...");
                            Entity createdEmail = CreateEmailWithAttachments(strTemplateId, toContact, activityPartyToColl, activityPartyFromColl);

                            log.Info("Sending email...");
                            emailId = SendEmail(createdEmail);
                            Guid logid = EntityApiUtils.CreateLog(ServiceProxy,
                                new EntityReference("contact", emailEntity.FromUserId),
                                (EntityReference)toContact["partyid"], "Email sent with template.", "Email sent " + emailId);
                        }
                        catch (Exception ex)
                        {
                            log.Error("Error sending email, Count " + count);
                            log.Error(ex);
                            Guid logid = EntityApiUtils.CreateLog(ServiceProxy,
                                new EntityReference("contact", emailEntity.FromUserId),
                                (EntityReference)toContact["partyid"], "Email sent with template.", "Email sent " + emailId);
                            log.Info("CRM Log Id " + logid);
                        }
                        count++;
                    }
                    #endregion
                }
                else
                {
                    #region Without Tempalate
                    try
                    {
                        log.Info("Without email template");
                        var emailCrmEntity = new Entity("email");
                        emailCrmEntity.Attributes.Add("bcc", activityPartyBccColl);
                        emailCrmEntity.Attributes.Add("from", activityPartyFromColl);
                        emailCrmEntity.Attributes.Add("subject", emailEntity.EmailSubject);
                        emailCrmEntity.Attributes.Add("description", "<pre style='margin: 0;'>" + emailEntity.EmailBody + "</pre>");
                        emailCrmEntity.Attributes.Add("directioncode", true);

                        log.Info("creating email...");
                        emailId = ServiceProxy.Create(emailCrmEntity);
                        emailCrmEntity.Id = emailId;

                        log.Info("Sending email...");
                        emailId = SendEmail(emailCrmEntity);
                    }
                    catch (Exception withoutTempEx)
                    {
                        log.Error("SendEmail without template");
                        log.Error(withoutTempEx.Message);
                        Guid crmlogid = EntityApiUtils.CreateLog(ServiceProxy, new EntityReference("contact", emailEntity.FromUserId), "Error in SendEmail() without template ", withoutTempEx.Message);
                        log.Info("Crm log id " + crmlogid);
                    }
                    #endregion
                }
                log.Info("Exiting SendEmail constructor");
            }
            catch (Exception ex)
            {
                log.Error("Error in SendEmail()");
                log.Error(ex.Message);
                Guid crmlogid = EntityApiUtils.CreateLog(ServiceProxy, "Error in SendEmail() ", ex.Message);
                log.Info("Crm log id " + crmlogid);
            }
            return new JsonResult() { Data = emailId };
        }

        [System.Web.Http.HttpPost]
        [System.Web.Http.Route("api/email/preview")]
        public JsonResult PreviewEmail(EmailEntity crmEmail)
        {
            log.Info("Entered PreviewEmail constructor");


            var activityPartyBccColl = new EntityCollection();
            if (crmEmail.ToAll)
            {
                PopulateAllContactsFromFilter(crmEmail, activityPartyBccColl);
            }
            else
            {
                activityPartyBccColl = PopulateContactsProvided(crmEmail, activityPartyBccColl);
            }

            Entity toContact = new Entity("contact");
            toContact.Id = ((EntityReference)activityPartyBccColl.Entities[0]["partyid"]).Id;

            var jobjTemplate = (JObject)crmEmail.Template;
            string strTemplateId = null;
            if (jobjTemplate != null)
            {
                strTemplateId = getPropertyValue(jobjTemplate, "Id");
            }
            var emailId = Guid.Empty;

            EntityCollection coll = new EntityCollection();

            if (!string.IsNullOrEmpty(strTemplateId))
            {

                UpdateContactWithPersonalNotes(crmEmail.EmailText, crmEmail.EmailSubject, crmEmail.EmailBody, toContact.Id);
                InstantiateTemplateRequest instTemplate = new InstantiateTemplateRequest();
                instTemplate.TemplateId = new Guid(strTemplateId);
                instTemplate.ObjectId = toContact.Id;
                instTemplate.ObjectType = "contact";

                InstantiateTemplateResponse instTemplateResponse = (InstantiateTemplateResponse)ServiceProxy.Execute(instTemplate);

                Entity emailPreview = (Entity)instTemplateResponse.EntityCollection.Entities[0];
                coll.Entities.Add(emailPreview);
            }



            log.Info("Exiting PreviewEmail constructor");

            return new JsonResult() { Data = GetResultSet(coll) };
        }

        #endregion

        #region Private Methods

        private Guid RetrieveFromQueue(EmailEntity emailEntity)
        {
            var querybyattribute = new QueryByAttribute("contact");
            querybyattribute.ColumnSet = new ColumnSet(new string[] { "emailaddress1" });
            querybyattribute.AddAttributeValue("contactid", emailEntity.FromUserId);
            var fromContact = ServiceProxy.RetrieveMultiple(querybyattribute).Entities[0];

            querybyattribute = new QueryByAttribute("queue");
            querybyattribute.ColumnSet = new ColumnSet(false);
            querybyattribute.AddAttributeValue("emailaddress", fromContact.GetAttributeValue<string>("emailaddress1"));
            var retrieved = ServiceProxy.RetrieveMultiple(querybyattribute);
            if (retrieved.Entities.Count > 0)
                return retrieved.Entities[0].Id;
            else
                return Guid.Empty;
        }

        private Guid RetrieveFromQueue(Entity fromContact)
        {           
            var querybyattribute = new QueryByAttribute("queue");
            querybyattribute.ColumnSet = new ColumnSet(false);
            querybyattribute.AddAttributeValue("emailaddress", fromContact.GetAttributeValue<string>("emailaddress1"));
            var retrieved = ServiceProxy.RetrieveMultiple(querybyattribute);
            if (retrieved.Entities.Count > 0)
                return retrieved.Entities[0].Id;
            else
                return Guid.Empty;
        }

        private EntityCollection PopulateContactsProvided(EmailEntity emailEntity, EntityCollection activityPartyBccColl)
        {
            var jArrayTo = (JArray)emailEntity.To;
            var jobjToArray = jArrayTo.Children<JObject>();
            foreach (var jobjTo in jobjToArray)
            {
                var toContactId = new Guid(getPropertyValue(jobjTo, "Id"));
                var activityPartyTo = new Entity("activityparty");
                activityPartyTo.Attributes.Add("partyid", new EntityReference("contact", toContactId));
                activityPartyBccColl.Entities.Add(activityPartyTo);
            }
            return activityPartyBccColl;
        }

        private void PopulateAllContactsFromFilter(EmailEntity emailEntity, EntityCollection activityPartyBccColl)
        {
            var jArrayToAllFilter = (JArray)emailEntity.ToAllFilter;
            var jobjToAllFilterArray = jArrayToAllFilter.Children<JObject>();
            var filterConditions = new List<FilterCondition>();
            foreach (var jobjToAllFilter in jobjToAllFilterArray)
            {
                var attributeName = getPropertyValue(jobjToAllFilter, "attributeName");
                var attributeValue = getPropertyValue(jobjToAllFilter, "attributeValue");
                var operatorValue = getPropertyValue(jobjToAllFilter, "operator");
                var attributeType = getPropertyValue(jobjToAllFilter, "attributeType");
                filterConditions.Add(new FilterCondition()
                {
                    attributeName = attributeName,
                    attributeValue = attributeValue,
                    attributeType = attributeType,
                    Operator = operatorValue
                });
            }

            var odataQueryObject = new ODataQuery()
            {
                Columns = new string[] { "contactid" },
                EntityName = "contact",
                FilterConditions = filterConditions
            };

            var retrieveMultipleResponse = EntityApiUtils.RetrieveEntities(ServiceProxy, odataQueryObject);
            foreach (var entity in retrieveMultipleResponse.EntityCollection.Entities)
            {
                foreach (var attribute in entity.Attributes)
                {
                    var toContactId = (Guid)attribute.Value;
                    var activityPartyTo = new Entity("activityparty");
                    activityPartyTo.Attributes.Add("partyid", new EntityReference("contact", toContactId));
                    activityPartyBccColl.Entities.Add(activityPartyTo);
                }
            }
        }

        private Guid SendEmail(Entity emailCrmEntity)
        {
            var emailId = emailCrmEntity.Id;
            var sendEmailreq = new SendEmailRequest
            {
                EmailId = emailId,
                TrackingToken = "",
                IssueSend = true
            };
            var sendEmailresp = (SendEmailResponse)ServiceProxy.Execute(sendEmailreq);

            return emailId;
        }

        private String getPropertyValue(JObject jobj, String propertyName)
        {
            return (from prop in jobj.Properties() where prop.Name == propertyName select prop.Value.Value<String>()).FirstOrDefault();
        }

        //MTCCA-174.
        private void UpdateContactWithPersonalNotes(string emailText, string emailSubject, string emailDescription, Guid toId)
        {
            try
            {
                var crmContactEntity = new Entity("contact");
                crmContactEntity.Id = toId;
                crmContactEntity.Attributes.Add("concap_emailtext", emailText);
                crmContactEntity.Attributes.Add("concap_emailsubject", emailSubject);
                crmContactEntity.Attributes.Add("concap_emaildescription", emailDescription);
                log.Debug(" Updating contact" + toId + " with " + emailText + " ...");
                ServiceProxy.Update(crmContactEntity);
                log.Debug(" Updated the contact");
            }
            catch (FaultException faultException)
            {
                log.Error("An Error Occured while updating the contact  " + toId + " " + faultException.Message);
                throw new FaultException(" ==An Error Occured in retrieving the Organization Proxy== " +
                                         faultException.Message);
            }
        }

        //MTCCA-166
        public List<Entity> CreateActivityMimeAttachments(Entity template, Guid builtEmailId,
            bool allowDuplicateAttachments, bool onlyUseAttachmentsInTemplate)
        {
            if (builtEmailId != Guid.Empty)
            {
                QueryExpression query = new QueryExpression("activitymimeattachment");
                query.NoLock = true;
                query.ColumnSet = new ColumnSet(new string[] { "attachmentid", "filename", "objectid" });
                query.Criteria.FilterOperator = LogicalOperator.And;
                query.Criteria.AddCondition("objecttypecode", ConditionOperator.Equal, "template");

                if (onlyUseAttachmentsInTemplate)
                    query.Criteria.AddCondition("objectid", ConditionOperator.Equal, template.Id);

                EntityCollection activitymimeattachmentCollection = ServiceProxy.RetrieveMultiple(query);

                if (activitymimeattachmentCollection.Entities.Count == 0)
                    return new List<Entity>(0);

                IEnumerable<IGrouping<string, Entity>> activitymimeattachmentsGroupByFilename =
                    activitymimeattachmentCollection.Entities.GroupBy(item => ((string)item["filename"]));
                IEnumerable<IGrouping<Guid, Entity>> activitymimeattachmentsGroupByFilenameAndAttachmentId = null;
                Entity activityMimeAttachment = null;
                List<Entity> activitymimeattachmentsResult = new List<Entity>();

                foreach (IGrouping<string, Entity> groupByFilename in activitymimeattachmentsGroupByFilename)
                {
                    activitymimeattachmentsGroupByFilenameAndAttachmentId =
                        groupByFilename.GroupBy(item => ((EntityReference)item["attachmentid"]).Id);

                    if (allowDuplicateAttachments)
                    {
                        foreach (
                            var activitymimeattachmentGroup in activitymimeattachmentsGroupByFilenameAndAttachmentId)
                        {
                            activityMimeAttachment = new Entity("activitymimeattachment");
                            activityMimeAttachment["objectid"] = new EntityReference("email", builtEmailId);
                            activityMimeAttachment["objecttypecode"] = "email";
                            activityMimeAttachment["attachmentid"] = new EntityReference("attachment",
                                activitymimeattachmentGroup.Key);
                            activityMimeAttachment["subject"] = string.Format("Attachment linked to template {0}",
                                template != null && template.Contains("title") ? template["title"] : string.Empty);
                            activityMimeAttachment.Id = ServiceProxy.Create(activityMimeAttachment);
                            activitymimeattachmentsResult.Add(activityMimeAttachment);
                        }
                    }
                    else
                    {
                        if (activitymimeattachmentsGroupByFilenameAndAttachmentId.Count() > 1)
                            throw new Exception(
                                string.Format(
                                    "Dupicate attachments are not allowed. There are two o more templates ({0}) with different attachments and same file name ({1})."));
                        else
                        {
                            activityMimeAttachment = new Entity("activitymimeattachment");
                            activityMimeAttachment["objectid"] = new EntityReference("email", builtEmailId);
                            activityMimeAttachment["objecttypecode"] = "email";
                            activityMimeAttachment["attachmentid"] = new EntityReference("attachment",
                                activitymimeattachmentsGroupByFilenameAndAttachmentId.First().Key);
                            activityMimeAttachment["subject"] = string.Format("Attachment linked to template {0}",
                                template != null && template.Contains("title") ? template["title"] : string.Empty);
                            activityMimeAttachment.Id = ServiceProxy.Create(activityMimeAttachment);
                            activitymimeattachmentsResult.Add(activityMimeAttachment);
                        }
                    }
                }
                return activitymimeattachmentsResult;
            }
            return new List<Entity>(0);
        }

        public Entity CreateEmailWithAttachments(string strTemplateId, Entity toContact, EntityCollection activityPartyToColl, EntityCollection activityPartyFromColl)
        {
            var emailId = Guid.Empty;
            InstantiateTemplateRequest instTemplate = new InstantiateTemplateRequest();
            instTemplate.TemplateId = new Guid(strTemplateId);
            instTemplate.ObjectId = ((EntityReference)toContact["partyid"]).Id;
            instTemplate.ObjectType = "contact";

            InstantiateTemplateResponse instTemplateResponse = (InstantiateTemplateResponse)ServiceProxy.Execute(instTemplate);

            var emailCrmEntity = (Entity)instTemplateResponse.EntityCollection.Entities[0];
            emailCrmEntity.Attributes.Add("to", activityPartyToColl);
            emailCrmEntity.Attributes.Add("from", activityPartyFromColl);
            emailCrmEntity.Attributes.Add("directioncode", true);

            Entity template = ServiceProxy.Retrieve("template", new Guid(strTemplateId), new ColumnSet(true));

            emailId = ServiceProxy.Create(emailCrmEntity);
            emailCrmEntity.Id = emailId;
            CreateActivityMimeAttachments(template, emailId, false, true);
            return emailCrmEntity;
        }

        private void AddAttachmentsToEmail(Entity email, EntityCollection attachments)
        {
            if (attachments.Entities.Count > 0)
            {
                log.Info(string.Format("Linking {0} attachmnets to Email", attachments.Entities.Count));
            }
            foreach (Entity attachment in attachments.Entities)
            {
                if (attachment.Contains("body") && attachment["body"] != null)
                {
                    Entity activityMimeAttachment = new Entity("activitymimeattachment");
                    activityMimeAttachment["objectid"] = new EntityReference("email", email.Id);
                    activityMimeAttachment["objecttypecode"] = "email";
                    activityMimeAttachment["subject"] = string.Format("Attachment linked to email from template");
                    activityMimeAttachment["body"] = attachment["body"];
                    activityMimeAttachment["filename"] = attachment["filename"];
                    activityMimeAttachment["mimetype"] = attachment["mimetype"];

                    activityMimeAttachment.Id = ServiceProxy.Create(activityMimeAttachment);
                }
            }
        }

        private ResultSet GetResultSet(EntityCollection entities)
        {
            IList<IDictionary<string, object>> recordsCollection = new List<IDictionary<string, object>>();
            // const string moneyType = "Money";
            bool hasMoreRecords = entities.MoreRecords;
            foreach (var entity in entities.Entities)
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

        private Entity GetEmailByTemplate(string strTemplateId, Entity toContact)
        {
            var emailId = Guid.Empty;
            InstantiateTemplateRequest instTemplate = new InstantiateTemplateRequest();
            instTemplate.TemplateId = new Guid(strTemplateId);
            instTemplate.ObjectId = ((EntityReference)toContact["partyid"]).Id;
            instTemplate.ObjectType = "contact";

            InstantiateTemplateResponse instTemplateResponse = (InstantiateTemplateResponse)ServiceProxy.Execute(instTemplate);

            var emailCrmEntity = (Entity)instTemplateResponse.EntityCollection.Entities[0];

            return emailCrmEntity;
        }

        private string GetContactEmail(IOrganizationService service, Guid id)
        {
            string email = "";
            Entity contact = service.Retrieve("contact", id, new ColumnSet(new string[] { "emailaddress1" }));
            if (contact.Contains("emailaddress1"))
            {
                email = contact["emailaddress1"].ToString();
            }
            return email;
        }

        private string GetContactEmail(Entity contact)
        {
            string email = "";
            if (contact.Contains("emailaddress1"))
            {
                email = contact["emailaddress1"].ToString();
            }
            return email;
        }

        private async Task<Response> SendEmailAsync(string fromEmail, string toEmail, string replyToEmail, string subject, string htmlContent, List<Attachment> listOfAttachments)
        {
            var apiKey = WebConfigurationManager.AppSettings["SendGridKey"];
            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(fromEmail);
            var to = new EmailAddress(toEmail);
            var plainTextContent = "";

            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
            if (!string.IsNullOrEmpty(replyToEmail))
            {
                msg.ReplyTo = new EmailAddress(replyToEmail);
            }
            if (listOfAttachments != null && listOfAttachments.Count > 0)
            {
                msg.Attachments = listOfAttachments;
            }
            //msg.MailSettings = new MailSettings();
            var task = await client.SendEmailAsync(msg);
            return task;


        }

        private async Task<Response> SendEmailAsync(string fromEmail, string toEmail, List<string> cc, string replyToEmail, string subject, string htmlContent, List<Attachment> listOfAttachments)
        {
            var apiKey = WebConfigurationManager.AppSettings["SendGridKey"];
            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(fromEmail);
            var to = new EmailAddress(toEmail);
            var plainTextContent = "";

            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
            if (!string.IsNullOrEmpty(replyToEmail))
            {
                msg.ReplyTo = new EmailAddress(replyToEmail);
            }
            if (listOfAttachments != null && listOfAttachments.Count > 0)
            {
                msg.Attachments = listOfAttachments;
            }
            if (cc != null)
            {
                foreach(string ccEmail in cc)
                {
                    msg.AddCc(ccEmail);
                }
              
            }

            //msg.MailSettings = new MailSettings();
            var task = await client.SendEmailAsync(msg);
            return task;


        }

        private EntityCollection GetTemplateAttachments(Guid templateId)
        {
            QueryExpression query = new QueryExpression("activitymimeattachment");
            query.ColumnSet = new ColumnSet(true);
            query.Criteria = new FilterExpression(LogicalOperator.And);
            query.Criteria.AddCondition("objectid", ConditionOperator.Equal, templateId);
            return ServiceProxy.RetrieveMultiple(query);
        }

        private Guid CreateEntity(Entity entity)
        {
            return ServiceProxy.Create(entity);
        }

        private EntityCollection GetEmailFrom(EmailEntity emailEntity)
        {
            var fromQueueId = RetrieveFromQueue(emailEntity);

            var activityPartyFrom = new Entity("activityparty");
            activityPartyFrom.Attributes.Add("partyid", new EntityReference("queue", fromQueueId));

            var activityPartyFromColl = new EntityCollection();
            activityPartyFromColl.Entities.Add(activityPartyFrom);

            return activityPartyFromColl;
        }

        private EntityCollection GetEmailFrom(Entity contact)
        {
            var fromQueueId = RetrieveFromQueue(contact);

            var activityPartyFrom = new Entity("activityparty");
            activityPartyFrom.Attributes.Add("partyid", new EntityReference("queue", fromQueueId));

            var activityPartyFromColl = new EntityCollection();
            activityPartyFromColl.Entities.Add(activityPartyFrom);

            return activityPartyFromColl;
        }

        private EntityCollection GetEmailTo(Entity toContact)
        {
            var activityPartyToColl = new EntityCollection();
            var activityPartyTo = new Entity("activityparty");
            var toId = ((EntityReference)toContact["partyid"]).Id;
            activityPartyTo.Attributes.Add("partyid", new EntityReference("contact", toId));
            activityPartyToColl.Entities.Add(activityPartyTo);
            return activityPartyToColl;
        }

        private Guid CreateEmailInCrm(string subject, Guid repId, EntityCollection to, EntityCollection from)
        {
            Entity email = new Entity("email");
            email.Attributes.Add("regardingobjectid", new EntityReference("contact", repId));
            email.Attributes.Add("to", to);
            email.Attributes.Add("from", from);
            email.Attributes.Add("subject", subject);

            return ServiceProxy.Create(email);
        }

        private Guid CreateEmailInCrm(string subject, Guid repId, EntityCollection to, EntityCollection from, EntityCollection cc)
        {
            Entity email = new Entity("email");
            email.Attributes.Add("regardingobjectid", new EntityReference("contact", repId));
            email.Attributes.Add("to", to);
            email.Attributes.Add("from", from);
            email.Attributes.Add("subject", subject);
            email.Attributes.Add("cc", cc);

            return ServiceProxy.Create(email);
        }

        private EntityCollection GetEmailCcCollection(Entity rep, EmailEntity input)
        {
            log.Info("GetEmailCcCollection()");
            EntityCollection ccColl = new EntityCollection();
            if(input.CCManager == true)
            {
                if(rep.Contains("concap_hdcmanagerid") && rep["concap_hdcmanagerid"] != null)
                {
                    var activityParty_cc = new Entity("activityparty");
                    activityParty_cc.Attributes.Add("partyid", rep["concap_hdcmanagerid"]);
                    ccColl.Entities.Add(activityParty_cc);
                }
            }
            return ccColl;
        }

        private string GetManagerEmail(Entity rep)
        {
            string managerEmail = string.Empty;
            if (rep.Contains("concap_hdcmanagerid") && rep["concap_hdcmanagerid"] != null)
            {
               Entity hdcMaager = ServiceProxy.Retrieve("concap_hdcmanager", ((EntityReference)rep["concap_hdcmanagerid"]).Id,
                    new ColumnSet(new string[] { "emailaddress" }));
                if (hdcMaager.Contains("emailaddress") && hdcMaager["emailaddress"] != null)
                {
                    managerEmail = hdcMaager["emailaddress"].ToString();
                }
            }
            return managerEmail;
        }

        #endregion
        
    }
}