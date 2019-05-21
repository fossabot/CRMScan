using System;

namespace WebAPI.Models
{
    public class EmailEntity
    {
        private object _to;
        private Guid _fromUserId;
        private object _template;
        private String _emailText;
        private String _emailSubject;
        private String _emailBody;
        private Boolean _toAll;
        private object _toAllFilter;
        private Boolean _ccManager;
        private string _replyTo;

        public object To
        {
            get { return _to; }
            set { _to = value; }
        }

        public Guid FromUserId
        {
            get { return _fromUserId; }
            set { _fromUserId = value; }
        }

        public object Template
        {
            get { return _template; }
            set { _template = value; }
        }

        public String EmailText
        {
            get { return _emailText; }
            set { _emailText = value; }
        }

        public String EmailSubject
        {
            get { return _emailSubject; }
            set { _emailSubject = value; }
        }

        public String EmailBody
        {
            get { return _emailBody; }
            set { _emailBody = value; }
        }

        public Boolean ToAll
        {
            get { return _toAll; }
            set { _toAll = value; }
        }

        public Boolean CCManager
        {
            get { return _ccManager; }
            set { _ccManager = value; }
        }

        public object ToAllFilter
        {
            get { return _toAllFilter; }
            set { _toAllFilter = value; }
        }
        public String ReplyTo
        {
            get { return _replyTo; }
            set { _replyTo = value; }
        }
    }
}