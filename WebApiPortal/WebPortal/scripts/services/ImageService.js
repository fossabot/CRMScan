angular.module('ImageServiceModule', [])
   .factory('ImageService', function ($http) {

       //XML to be used to for adding the webresource relative paths for the entities
       var imagesXml = "<xml version='1.0'>" +
       "<entity name='appointment' dataDefAttr='ActivityTypeCode'>wipfli_appointmentImage.gif</entity>" +
       "<entity name='email' dataDefAttr='ActivityTypeCode'>wipfli_emailImage.JPG</entity>" +
       "<entity name='letter' dataDefAttr='ActivityTypeCode'>wipfli_letterImage.gif</entity>" +
        "<entity name='phonecall' dataDefAttr='ActivityTypeCode'>wipfli_phonecallImage.gif</entity>" +
        "<entity name='task' dataDefAttr='ActivityTypeCode'>wipfli_taskImage.gif</entity>" +
        "<entity name='opportunityclose' dataDefAttr='ActivityTypeCode'>wipfli_opportunityCloseImage.png</entity>" +
       "<entity name='campaignresponse' dataDefAttr='ActivityTypeCode'>wipfli_campaignResponse.gif</entity>" +
       "<entity name='serviceappointment' dataDefAttr='ActivityTypeCode'>wipfli_serviceActivityImage.gif</entity>" +
       "<entity name='fax' dataDefAttr='ActivityTypeCode'>wipfli_faxImage.gif</entity>" +
       "</xml>";
       var factory = {};
       //Service Method to retrieve the Image Webresource path based on the entity Logical Name
       factory.getImagePath = function (entityLogicalName, dataDefAttr) {
           var xmlDoc = $.parseXML(imagesXml);
           var imagePath;
           var $xml = $(xmlDoc);
           $xml.find('entity').each(function () {
               dataDefAttr = (dataDefAttr != null) ? dataDefAttr : "";
               if ($(this).attr("name") == entityLogicalName && $(this).attr("dataDefAttr") == dataDefAttr) {
                   imagePath = $(this).text();
               }
           });
           return imagePath;
       };
       return factory;
   });
