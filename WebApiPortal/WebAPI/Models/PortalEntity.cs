using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebAPI.Models
{
    public class PortalEntity
    {
        private IDictionary<string, object> _portalAttributes;
        private string _entityName;
        private Guid _Id;
        private List<Column> _Columns;

        public IDictionary<string, object> PortalAttributes
        {
            get { return _portalAttributes; }
            set
            {
                _portalAttributes = value;
            }
        }

        public string entityName
        {
            get
            {
                return _entityName;
            }
            set { _entityName = value; }
        }

        public Guid Id
        {
            get
            {
                return _Id;
            }
            set { _Id = value; }
        }

        public List<Column> Columns
        {
            get
            {
                return _Columns;
            }
            set
            {
                _Columns = value;
            }
        }
    }

    public class CreateEntity
    {
        private IDictionary<string, object> _portalAttributes;
        private string _entityName;
        private Guid _Id;
        private List<Column> _Columns;

        public IDictionary<string, object> PortalAttributes
        {
            get { return _portalAttributes; }
            set
            {
                _portalAttributes = value;
            }
        }

        public string entityName
        {
            get
            {
                return _entityName;
            }
            set { _entityName = value; }
        }
               
        public List<Column> Columns
        {
            get
            {
                return _Columns;
            }
            set
            {
                _Columns = value;
            }
        }
    }
}