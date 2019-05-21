using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebAPI.Models
{
    public class FilterCondition
    {
        private object _attributeValue;
        public string attributeName { get; set; }
        public string attributeType { get; set; }
        public object attributeValue
        {
            get
            {
                return _attributeValue;
            }
            set
            {
                _attributeValue = value;
            }
        }

        public string Operator { get; set; }
    }
}