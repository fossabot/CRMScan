//loads the chart with all the nodes expanded - demo shown.
//after viewing all the data any node can be collapsed or expanded on click.
//Horizontal tree with left to right with circular nodes with one label text.
var collapsibleTreeDirectiveModule = angular.module("CollapsibleTreeDirectiveModule", []);
collapsibleTreeDirectiveModule.directive('wipflicollapsibletree', ['ImageService', 'MetaDataService', function (ImageService, MetaDataService) {
    return {
        restrict: 'E',
            link: function (scope, element, attrs) {
                debugger;

                var divElement = "<div Id='CTree'></div>";
                var ctreeDiv = angular.element(divElement);
                element.append(ctreeDiv);
                var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
                var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

                var margin = { top: 20, right: 20, bottom: 30, left: 40 },
               
             width = w - margin.left - margin.right,
             height = h - margin.top - margin.bottom;
        
            var i = 0,  duration = 750,  root;

            var tree = d3.layout.tree()
                .size([height, width]);

            var diagonal = d3.svg.diagonal()
                .projection(function (d) { return [d.y, d.x]; });

            var svg = d3.select(element[0])
              .append("svg")
              .attr('width', width + margin.left + margin.right)
              .attr('height', height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
              var formatteddata = CreateDataFormatForTree(scope.data, scope.viewcomposition);
           // var formatteddata = scope.data[0].records;

                var dataMap = formatteddata.reduce(function (map, node) {
                map[node.name] = node;
                return map;
            }, {})

            var treeData = [];
            formatteddata.forEach(function (node) {
                // add to parent
                var parent = dataMap[node.parent];
                if (parent) {
                    // create child array if it doesn't exist
                    (parent.children || (parent.children = []))
                     // add node to child array
                     .push(node);
                } else {
                    // parent is null or missing
                    treeData.push(node);
                }
            });

            root = treeData[0];
            root = { x0: height / 2, y0: 0 };
            //root.x0 = height / 2;
            //root.y0 = 0;

            function collapse(d) {
                if (d.children) {
                    d._children = d.children;
                    d._children.forEach(collapse);
                    d.children = null;
                }
            }

            root.children.forEach(collapse);

            update(root);

            d3.select(self.frameElement).style("height", "800px");

            function update(source) {

                // Compute the new tree layout.
                var nodes = tree.nodes(root).reverse(),
                    links = tree.links(nodes);

                // Normalize for fixed-depth.
                nodes.forEach(function (d) { d.y = d.depth * 180; });

                // Update the nodes…
                var node = svg.selectAll("g.node")
                    .data(nodes, function (d) { return d.id || (d.id = ++i); });

                // Enter any new nodes at the parent's previous position.
                var nodeEnter = node.enter().append("g")
                    .attr("class", "node")
                    .attr("transform", function (d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
                    .on("click", click);

                nodeEnter.append("circle")
                    .attr("r", 1e-6)
                    .style("fill", function (d) { return d._children ? "lightsteelblue" : "#fff"; });

                nodeEnter.append("text")
                    .attr("x", function (d) { return d.children || d._children ? -10 : 10; })
                    .attr("dy", ".35em")
                    .attr("text-anchor", function (d) { return d.children || d._children ? "end" : "start"; })
                    .text(function (d) { return d.name; })
                    .style("fill-opacity", 1e-6);

                // Transition nodes to their new position.
                var nodeUpdate = node.transition()
                    .duration(duration)
                    .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; });

                nodeUpdate.select("circle")
                    .attr("r", 4.5)
                    .style("fill", function (d) { return d._children ? "lightsteelblue" : "#fff"; });

                nodeUpdate.select("text")
                    .style("fill-opacity", 1);

                // Transition exiting nodes to the parent's new position.
                var nodeExit = node.exit().transition()
                    .duration(duration)
                    .attr("transform", function (d) { return "translate(" + source.y + "," + source.x + ")"; })
                    .remove();

                nodeExit.select("circle")
                    .attr("r", 1e-6);

                nodeExit.select("text")
                    .style("fill-opacity", 1e-6);

                // Update the links…
                var link = svg.selectAll("path.link")
                    .data(links, function (d) { return d.target.id; });

                // Enter any new links at the parent's previous position.
                link.enter().insert("path", "g")
                    .attr("class", "link")
                    .attr("d", function (d) {
                        var o = { x: source.x0, y: source.y0 };
                        return diagonal({ source: o, target: o });
                    });

                // Transition links to their new position.
                link.transition()
                    .duration(duration)
                    .attr("d", diagonal);

                // Transition exiting nodes to the parent's new position.
                link.exit().transition()
                    .duration(duration)
                    .attr("d", function (d) {
                        var o = { x: source.x, y: source.y };
                        return diagonal({ source: o, target: o });
                    })
                    .remove();

                // Stash the old positions for transition.
                nodes.forEach(function (d) {
                    d.x0 = d.x;
                    d.y0 = d.y;
                });
            }

            // Toggle children on click.
            function click(d) {
                if (d.children) {

                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                //Adding code for sub contact

                //
                update(d);
            }
            
            function CreateDataFormatForTree(crmData, viewCompositionNode) {
                
                var rootNode;
                var formatData = [];               
                if (crmData.length > 0) {
                    if (crmData[0].records.length > 0) {
                        rootNode = crmData[0].records[0].ParentAccountId;
                        var dataDefintion = crmData[0].dataDefinition;
                        formatData.push({ name: "Account", parent: "null" });
                        formatData.push({ name: dataDefintion, parent: "Account" });
                        crmData[0].records.every(function (element, index, array) {
                          
                           // var childRecordCount = element.records.length;
                          //  element.records.every(function (element, index, array) {                           
                                var childNode = element[scope.viewDefinition.DispalyName];
                                var id = element[scope.viewDefinition.id];
                                var parentNode = element[scope.viewDefinition.Parent].Name;
                                if (parentNode == null)
                                    formatData.push({ name: childNode, parent: dataDefintion });
                                 else
                                    formatData.push({ name: childNode, parent: parentNode });
                             /*   if (index >= childRecordCount) {

                                    return false;
                                }

                               // return true;
                           // });*/
                            if (index >= crmData[0].records.length) {
                                return false;
                            }

                            return true;
                        });
                    }
                }
                return formatData;
            }
        } 
    };
}]);