//loads the chart with all the nodes expanded - demo shown.
//after viewing all the data any node can be collapsed or expanded on click.
//Verical tree with top to botton with rectangle nodes with entity icon and few entity information fields.

var orgChartDirectiveModule = angular.module("OrgChartDirectiveModule", []);
orgChartDirectiveModule.directive('wipfliorgchart', ['ImageService', 'MetaDataService', function (ImageService, MetaDataService) {
    return {
        restrict: 'E',
       scope:
            {
                parentScopeData: "=",
                parentScopeViewdefination: "="
               
            },
        link: function (scope, element, attrs) {
            debugger;
            var displayColumns = [];
            var divElement = "<div Id='CTree'></div>";
            ctreeDiv = angular.element(divElement);
            element.append(ctreeDiv);
            var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

            var margin = { top: 20, right: 20, bottom: 30, left: 20 };
            width = w - margin.left - margin.right,
            height = h - margin.top - margin.bottom;

            rectW = 200,
            rectH = 125;

            var nodeGap = rectW+25;
            var svgPostionWidth = (width - margin.left) / 2;
            var svgPostionHeight = 0;

            var i = 0, duration = 750, root;

            var tree = d3.layout.tree().nodeSize([nodeGap, 0]);

            var diagonal = d3.svg.diagonal()
             .projection(function (d) {
                 return [d.x + rectW / 2, d.y + rectH / 2];
             });

            var svg = d3.select(element[0]).append("svg").attr("width", width).attr("height", width)
                         .append("g")
          .attr("transform", "translate(" + svgPostionWidth + "," + svgPostionHeight + ")");


            drawOrgChart();

            function collapse(d) {
                if (d.children) {
                    d._children = d.children;
                    d._children.forEach(collapse);
                    d.children = null;
                }
            }

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
                    .attr("transform", function (d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
                     .on("click", click);

                nodeEnter.append("rect")
               .attr("width", rectW)
               .attr("height", rectH)
                .attr("rx", 10)
                .attr("ry", 10)
               .attr("stroke", "black")
               .attr("stroke-width", 1)
               .style("fill", function (d) {
                   return d._children ? "#58ACFA" : "#58ACFA";
               });

        svg.selectAll('.node').append("foreignObject")
              .attr("x", 50)
              .attr("y", 5)
              .attr("width", rectW-50)
              .attr("height", rectH-5)
               .append("xhtml:body").style("overflow", "hidden")
              .style("background-color", "#58ACFA")
               .append("xhtml:div")
            .attr("width", rectW- 50)
             .attr("height", rectH - 5)
                .style("color","white")
                .style("overflow-y", "hidden")
                .style("overflow-x", "hidden")
              .style("top", "125")
       .style("font-family","sans-serif")
               .style("font-size","10") 
              .style("background-color", "#58ACFA").html(function (d) { return "Name:"+ d.name + "<br> Mobile.No:" + d.MobilePhone+"<br> e-Mail:"+d.EmailAddress })
                    .append("xhtml:div")
                   .html(function (d) { return "<div>Show Details</div>" })
                     .on("click", divclick);


                nodeEnter.append("title")
                .text(function (d) {
                    return d.name
                });

              nodeEnter.append("image")
                .attr("xlink:href", function (d) { return d.picture })
                    .style("fill", "#58ACFA")
                 .attr("x", 8)
                 .attr("y", 10)
                 .attr("width", 50)
                 .attr("height", 50);

           /*   nodeEnter.append("image")
              .attr("xlink:href", function (d) { return d.picture })
                  .style("fill", "#58ACFA")
                  .style("visibility", function (d) { return !d._children ? "hidden" : "visible"; })
               .attr("x", rectW-25)
               .attr("y", 5)
               .attr("width", 20)
               .attr("height", 20);*/

                // Transition nodes to their new position.
                var nodeUpdate = node.transition()
                    .duration(duration)
                    .attr("transform", function (d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    });
                nodeUpdate.select("rect")
                    .attr("width", rectW)
                    .attr("height", rectH)
                       .attr("rx", 10)
                  .attr("ry", 10)
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .style("fill", function (d) {
                        return d._children ? "58ACFA" : "58ACFA";
                    });

                nodeUpdate.select("text")
                    .style("fill-opacity", 1);
                // Transition exiting nodes to the parent's new position.
                var nodeExit = node.exit().transition()
                    .duration(duration)
                    .attr("transform", function (d) {
                        return "translate(" + source.x + "," + source.y + ")";
                    })
                    .remove();

                nodeExit.select("rect")
                .attr("width", rectW)
                .attr("height", rectH)
                 .attr("rx", 10)
                  .attr("ry", 10)
                .attr("stroke", "black")
                .attr("stroke-width", 1);

                nodeExit.select("text");

                // Update the links…
                var link = svg.selectAll("path.link")
            .data(links, function (d) {
                return d.target.id;
            });

                // Enter any new links at the parent's previous position.
                link.enter().insert("path", "g")
                .attr("class", "link")
                .attr("x", rectW / 2)
                .attr("y", rectH / 2)
                .attr("d", function (d) {
                    var o = {
                        x: source.x0,
                        y: source.y0
                    };
                    return diagonal({
                        source: o,
                        target: o
                    });
                });

                link.append("title")
                .text(function (d) {
                    return d.name
                });
                // Transition links to their new position.
                link.transition()
                    .duration(duration)
                    .attr("d", diagonal);

                // Transition exiting nodes to the parent's new position.
                link.exit().transition()
                    .duration(duration)
                    .attr("d", function (d) {
                        var o = {
                            x: source.x,
                            y: source.y
                        };
                        return diagonal({
                            source: o,
                            target: o
                        });
                    })
                    .remove();


                // Stash the old positions for transition.
                nodes.forEach(function (d) {
                    d.x0 = d.x;
                    d.y0 = d.y;
                });
            }

            function divclick(d) {
                var executeDivClick;
                for( var i =0; i < scope.parentScopeData[0].records.length;i++)
                {
                    if (d.id != scope.parentScopeData[0].records[i].ParentAccountId.Id)
                        executeDivClick = true;
                    else {
                        executeDivClick = false;
                        break;
                    }
                }
                if(executeDivClick)
                {
                    scope.$parent.$parent.loadPartialView(d.id);
                    scope.$apply("parentScopeData");
                   }
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
                update(d);
            }

            function CreateDataFormatForTree(crmData) {

                var rootNode;
                var formatData = [];
                var accountDefaultImage = "https://wipfliindiacrm.pptmidwest.com:446//_imgs/ContactPhoto.png?ver=-341517462";
              
                if (crmData.length > 0) {
                    if (crmData[0].records.length > 0) {
                        rootNode = crmData[0].records[0][scope.parentScopeViewdefination.Parent].Name;
                        
                        var dataDefintion = crmData[0].dataDefinition;
                        // formatData.push({ name: "Account", parent: "null" });
                        formatData.push({ name: rootNode, parent: "null", picture: accountDefaultImage });
                        crmData[0].records.every(function (element, index, array) {

                            // var childRecordCount = element.records.length;
                            //  element.records.every(function (element, index, array) {                           
                            var childNode = element[scope.parentScopeViewdefination.DispalyName];

                            var id = element[scope.parentScopeViewdefination.id];
                            var parentNode = element[scope.parentScopeViewdefination.Parent].Name;
                            var contactPicture = element[scope.parentScopeViewdefination.Picture];
                            var businessPhone = element[scope.parentScopeViewdefination.BusinessPhone];
                            var mobilePhone = element[scope.parentScopeViewdefination.MobilePhone];
                            var Address = element[scope.parentScopeViewdefination.Address];
                            var emailId = element[scope.parentScopeViewdefination.EmailAddress];

                            if (contactPicture == null)
                                contactPicture = "/_imgs/ContactPhoto.png?ver=-341517462"

                            if (parentNode == null)
                                formatData.push({id:id, name: childNode, parent: rootNode, Telephone: businessPhone, MobilePhone: mobilePhone, Address: Address, EmailAddress: emailId, picture: "https://wipfliindiacrm.pptmidwest.com:446/" + contactPicture });
                            else
                                formatData.push({id:id, name: childNode, parent: parentNode, Telephone: businessPhone, MobilePhone: mobilePhone, Address: Address, EmailAddress: emailId, picture: "https://wipfliindiacrm.pptmidwest.com:446/" + contactPicture });
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

            scope.$watch("parentScopeData", function (oldVal, newVal, scope) {
                drawOrgChart();
            }, true);


            function drawOrgChart() {

                var formatteddata = CreateDataFormatForTree(scope.parentScopeData);

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
                root.x0 = 0;
                root.y0 = width / 2;


                root.children.forEach(collapse);

                update(root);

                d3.select(self.frameElement).style("height", "800px");
            }

        }
    };
}]);