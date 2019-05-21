var ConfigName = null;
//var ConfigPath = null;
function getDataParam() {
    //Get the any query string parameters and load them
    //into the vals array
    var vals = new Array();
    if (location.search != '') {
        vals = location.search.substr(1).split('&');
        for (var i in vals) {
            vals[i] = vals[i].replace(/\+/g, ' ').split('=');
        }
        //look for the parameter named 'data'
        var found = false, foundIndex;
        for (var i in vals) {
            if (vals[i][0].toLowerCase() == 'data') {
                found = true;
                foundIndex = i;
                break;
            }
        }
        if (found) {
            parseDataValue(vals[foundIndex][1]);
        }
        if (!found) {
            noParams();
        }
    } else {
        noParams();
    }
}
function parseDataValue(datavalue) {
    if (datavalue != '') {
        var vals = new Array();
        //  var message = document.createElement("p");
        //message.innerText = "These are the data parameters values that were passed to this page:";
        //message.innerHTML = "These are the data parameters values that were passed to this page:";
        //    document.body.appendChild(message);
        vals = decodeURIComponent(datavalue).split('&');
        for (var i in vals) {
            vals[i] = vals[i].replace(/\+/g, ' ').split('=');
        }
        //CallPolicyAdmin(vals);
        preLoad(vals);  //return vals;
    } else {
        noParams();
    }  //return vals;
}
function noParams() {
    //var message = document.createElement("p");
    //message.innerText = "No data parameter was passed to this page";
    //message.innerHTML = "No data parameter was passed to this page";
    //document.body.appendChild(message);
    bootStrapApp();
}
function preLoad(vals) {
    var timelineFound = false;
    for (var i in vals) {
        if (vals[i][0] == 'timeline') {
            timelineFound = true;
        } else if (vals[i][0].toLowerCase() == 'configname') {
            ConfigName = vals[i][1];
        }  //else if (vals[i][0].toLowerCase() == "configpath") {
        //    ConfigPath = vals[i][1];
        //}
    }
    if (timelineFound) {
        google.load('visualization', '1');
        google.setOnLoadCallback(bootStrapApp);
    }
}
function bootStrapApp() {
    angular.element(document).ready(function () {
        getDataParam();
        angular.bootstrap(document, ['CrmApp']);
    });
}