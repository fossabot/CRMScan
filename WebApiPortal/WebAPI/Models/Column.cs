using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebAPI.Models
{
    public class Column
    {
        public string dataDefAttr { get; set; }
        public string DisplayName { get; set; }
        public string type { get; set; }
        public string width { get; set; }
        public string hideDisplayName { get; set; }
        public string required { get; set; }
        public AllowedValues AllowedValues { get; set; }

        /*private List<AllowedValue> _AllowedValues;
        public List<AllowedValue> AllowedValues
        {
            get { return _AllowedValues; }
            set { _AllowedValues = value; }
        }*/
    }
}