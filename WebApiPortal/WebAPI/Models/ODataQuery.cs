using System.Collections.Generic;
using Microsoft.Xrm.Sdk.Query;

namespace WebAPI.Models
{
    public class ODataQuery
    {
        public string EntityName { get; set; }
        private string[] _columns;
        private IList<FilterCondition> _filterConditons;
        private IList<OrderByClause> _orderByClauses;
        private PagingInfo _pagingInfo;
        public string[] Columns
        {
            get { return _columns; }
            set { _columns = value; }
        }

        public IList<FilterCondition> FilterConditions
        {
            get { return _filterConditons; }
            set { _filterConditons = value; }
        }

        public IList<OrderByClause> OrderByClauses
        {
            get { return _orderByClauses; }
            set { _orderByClauses = value; }
        }

        public PagingInfo PagingInfo
        {
            get { return _pagingInfo; }
            set { _pagingInfo = value; }
        }
    }
}