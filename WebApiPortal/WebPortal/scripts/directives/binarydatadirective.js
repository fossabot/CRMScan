var wipfliBinaryDataModule = angular.module("WipfliBinaryDataModule", []);
wipfliBinaryDataModule.directive("wipfliBinaryData", ['MetaDataService', '$compile', '$modal', function (MetaDataService, $compile, $modal) {
    return {
        restrict: 'E',
        replace: true,
        scope:
            {
                columnDef: "=",
                record: "=",
                getBinaryImage: '&onClick'
            },

        link: function (scope, element, attrs) {
                        
            var innerText = scope.record[scope.columnDef.dataDefAttr];
               var ctreeDiv = angular.element("<a ng-click='downloadBinaryData();' download>" + innerText + "</a>");

            //var docBody = scope.record["documentbody"];
            //var mimetype = scope.record["mimetype"];
            //var blob = new Blob([docBody], { type: mimetype }); 
            //var url = window.URL.createObjectURL(blob);
            //var ctreeDiv = angular.element("<a href=javascript:window.open('data:" + mimetype + ";base64," + docBody + ");>" + innerText + "</a>");

            element.append(ctreeDiv);
            $compile(element.contents())(scope);

            scope.downloadBinaryData= function(){
                var promise = scope.getBinaryImage();
                promise.then(function (data, status, headers) {
                    var note = data;
                    var binary = data.Attributes[1].Value;
                    //var octetStreamMime = 'application/octet-stream';
                    var success = false;

                    // Get the headers
                    //headers = headers();

                    // Get the filename from the x-filename header or default to "download.bin"
                    var filename = data.Attributes[0].Value;

                    // Determine the content type from the header or default to "application/octet-stream"
                    var contentType = data.Attributes[2].Value;
                    try {
                        
                        var blobData = b64toBlob(binary, contentType, null);
                        var blob = new window.Blob([blobData], { type: contentType });
                        window.URL = window.URL || window.webkitURL;
                        var url = window.URL.createObjectURL(blob);
                        //window.location.href = url;
                        //window.open(url);
                        var dataHtml = "";
                        if (contentType.indexOf("image") == -1) {
                            dataHtml = "<iframe src='" + url + "' style='width:100%;height:100%;border:none;'></iframe>"
                        } else {
                            dataHtml = "<img src='" + url + "' style='width:100%;height:100%;border:none;'></img>"
                        }
                        var template = "<div class='modal-header'><span class='visible-xs-inline pull-right'><button type='button' class='btn btn-default' data-dismiss='modal' ng-click='cancel()'>Close</button></span></div><div class='modal-body' style='overflow-x: auto;overflow-y: auto;'><form class='form-inline'>" + dataHtml + "</form></div><div class='modal-footer'></div><button type='button' class='btn btn-default' data-dismiss='modal' ng-click='cancel()'>Close</button>";
                        var modalObject = {
                            template: template,
                            controller: 'BinaryDataModalCtrl',
                                resolve: {
                                    passThru: function () {
                                }
                            }

                        };
                       
                        var modalInstance = $modal.open(modalObject);

                        //var fileBytes = base64ToArrayBuffer(binary);
                        //download(fileBytes, filename, contentType);
                        
                        console.log("save file succeeded");
                        success = true;
                    } catch (ex) {
                        console.log("save binary data method failed with the following exception:");
                        console.log(ex);
                    }


                }
                , function (response) {
                    console.log("Error in binaryData directive!");
                    console.log(response);
                });
                
            }

            function base64ToArrayBuffer(base64) {
                var binaryString = window.atob(base64);
                var binaryLen = binaryString.length;
                var bytes = new Uint8Array(binaryLen);
                for (var i = 0; i < binaryLen; i++) {
                    var ascii = binaryString.charCodeAt(i);
                    bytes[i] = ascii;
                }
                return bytes;
            }

            function b64toBlob(b64Data, contentType, sliceSize) {
                contentType = contentType || '';
                sliceSize = sliceSize || 512;

                var byteCharacters = atob(b64Data);
                var byteArrays = [];

                for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                    var slice = byteCharacters.slice(offset, offset + sliceSize);

                    var byteNumbers = new Array(slice.length);
                    for (var i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }

                    var byteArray = new Uint8Array(byteNumbers);

                    byteArrays.push(byteArray);
                }

                var blob = new Blob(byteArrays, { type: contentType });
                return blob;
            }

            
        },


    };

}]);

wipfliBinaryDataModule.controller('BinaryDataModalCtrl', function (MetaDataService, appSpinnerService, toaster, $scope, $modalInstance, $timeout, passThru) {

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

});

