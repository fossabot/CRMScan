var radialTreeDirectiveModule = angular.module("radialTreeDirectiveModule", []);
radialTreeDirectiveModule.directive('wipfliradialtree', [ function () {
    return {
        restrict: 'E',
        scope:
            {
                selectedRecordId: "=",
                viewData: "=",
                viewDefinition : "="
            },
        link: function (scope, element, attrs) {
            debugger;

            var divElement = "<div Id='rTree'></div>";
            rtreeDiv = angular.element(divElement);
            element.append(rtreeDiv);

            var diameter = 450;
            width = diameter,
            height = diameter;

            var i = 0, duration = 750, root;

            

            var formatteddata = CreateDataFormatForTree(scope.viewData, scope.viewDefinition);

            var dataMap = formatteddata.reduce(function (map, node) {
                map[node.name] = node;
                return map;
            }, {});

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


            //root = treeData[0];
            updateTree(treeData[0]);

            function updateTree(root) {
                var tree = d3.layout.tree()
                .size([360, diameter / 2 - 80])
                .separation(function (a, b) { return (a.parent == b.parent ? 1 : 10) / a.depth; });

                var diagonal = d3.svg.diagonal.radial()
                    .projection(function (d) { return [d.y, d.x / 180 * Math.PI]; });
                var svg = null;
                if (scope.svg == null) {
                     svg = d3.select(element[0])
                      .append("svg")
                      .attr('width', diameter)
                      .attr('height', diameter)
                      .append("g")
                        .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");
                     scope.svg = svg;
                }
                else {
                    svg = scope.svg;
                }

                var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

                var link = svg.selectAll(".link")
                  .data(links)
                .enter().append("path")
                  .attr("class", "link")
                  .attr("d", diagonal)
                .style("stroke", function (d) { return d.target.color; });

                var node = svg.selectAll(".node")
                .data(nodes)
                 .enter().append("g")
                 .on("click", click)
              .attr("class", "node")

              .attr("transform", function (d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });

                node.append("circle")
               .attr("r", 6)
                .style("fill", function (d) { return d.color; });

                node.append("text")
               .attr("dy", ".31em")

               .attr("text-anchor", function (d) { return d.x < 180 ? "start" : "end"; })
               .attr("transform", function (d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
               .text(function (d) { return d.name; });

                d3.select(self.frameElement).style("height", "600px");
            }

            function CreateDataFormatForTree(crmData, viewDef) {
                var rootNode;
                var formatData = [];
                // var dataDefinitions = scope.dataDefinitions;
                var viewTypes = getViewTypes(viewDef);


                if (crmData.length > 0) {
                    formatData.push({ name: scope.selectedRecordId, parent: "null", color: "Gray" });
                    for (var viewTypeIndex = 0; viewTypeIndex < viewTypes.length; viewTypeIndex++) {
                        for (var i = 0; i < crmData.length; i++) {
                            if (viewTypes[viewTypeIndex].viewData == crmData[i].dataDefName) {
                                if (crmData[i].records.length > 0) {
                                    for (var j = 0; j < crmData[i].records.length; j++) {
                                        var id = crmData[i].records[j][viewTypes[viewTypeIndex].id];
                                        var nodeName = crmData[i].records[j][viewTypes[viewTypeIndex].name];
                                        var parentNode = scope.selectedRecordId;
                                        formatData.push({ id: id, name: nodeName, parent: parentNode, color: viewTypes[viewTypeIndex].color });

                                    }

                                }
                            }
                        }
                    }

                }
                return formatData;
            }

            function getViewTypes(viewDefinition) {
                var viewTypes = new Array();
                var viewDefTypes = viewDefinition.viewTypes.viewType;
                if (viewDefTypes != null) {
                    if (Object.prototype.toString.call(viewDefTypes) === '[object Array]') {
                        for (var i = 0; i < viewDefTypes.length; i++) {
                            viewTypes.push(viewDefTypes[i]);
                        }
                    }
                    else {
                        viewTypes.push(viewDefTypes);
                    }
                }

                return viewTypes;
            }

            function click(d) {
                //    var nodeInfo = { id: d.id, dataDefinition: d.datadefName };
                //    nodeInfo.push({ id: d.id, dataDefinition: d.datadefName });
                scope.$parent.refresh(d.id);

            }
            scope.$watch("viewData", function (oldVal, newVal, scope) {
                var formatteddata = CreateDataFormatForTree(scope.viewData, scope.viewDefinition);

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
                updateTree(treeData[0]);
            }, true);
        }
    };
}]);