using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebAPI.Models
{
    public class ResultSet
    {
        private IList<IDictionary<string, object>> _recordsCollection = new List<IDictionary<string, object>>();
        public IList<IDictionary<string, object>> recordsCollection
        {
            get
            {
                return _recordsCollection;
            }
            set
            {
                _recordsCollection = value;
            }
        }

        public bool HasMoreRecords{ get; set; }

        public string PagingCookie { get; set; }
    }
}