using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebAPI.Models
{
    public class OrderByClause
    {
        private OrderBy _orderByType;
        public string expression { get; set; }
        public OrderBy orderBy
        {
            get
            {
                return _orderByType;
            }
            set
            {
                _orderByType = value;
            }
        }

    }

    public enum OrderBy { ASC, DESC }
}