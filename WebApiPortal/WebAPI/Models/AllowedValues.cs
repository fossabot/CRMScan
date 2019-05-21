using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebAPI.Models
{
    public class AllowedValues
    {
        private List<AllowedValue> _AllowedValue;
        public List<AllowedValue> AllowedValue
        {
            get { return _AllowedValue; }
            set { _AllowedValue = value; }
        }
    }
}