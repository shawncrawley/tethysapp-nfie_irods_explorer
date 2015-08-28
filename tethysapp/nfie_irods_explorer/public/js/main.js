"use strict";

/***********************
 ****GLOBAL VARIABLES***
 ***********************/

/**********jQuery Handles**********/
var dropDowns = $('#drop-down');
var fileInfoDiv = $('#file-info');
var downloadButton = $('#download-button');
var uploadButton = $('#upload-button');
var viewerButton = $('#viewer-button');
var displayStatus = $('#display-status');

/**********General**********/
var downloadPath;

/*****************************************************
 ************GENERAL FUNCTIONS************************
 *****************************************************/
var clearFileInfo = function() {
    fileInfoDiv.empty();
    downloadButton.addClass('hidden');
    uploadButton.addClass('hidden');
    viewerButton.addClass('hidden');
    fileInfoDiv.resize();
};


/*************************
RUN ONCE DOCUMENT IS READY
 *************************/

$(function() { //run once page is ready

    $('#resource-keywords').tagsinput({confirmKeys: [32, 44]});

    //prepares initial page view//
    clearFileInfo(); //this clears divs and buttons associated with a file selection
    var dropDownHtml = $('#entries-hidden-text').text(); //a hidden div that receives the initial irods directory names
    dropDowns.append(dropDownHtml); //the html from the hidden div is added to the actual dropDowns div
    formatDropDown('folders'); //this formats the folders in the dropdown with folder images

    //adds event listeners to all present and future dropdowns//
    dropDowns.on('select2:select', '.folders',
        function(evt) {
            var numElements = $(this).nextAll().length;
            if (numElements != 1) {
                $(this).next().nextAll().remove();
            }
            var selection_path = evt.params.data.element.id;
            irodsQuery(selection_path);
            if (!(fileInfoDiv.is(':empty'))){clearFileInfo()}
        }
    );
    dropDowns.on('select2:unselect', '.folders',
        function() {
            $('[aria-expanded=true]').parent().parent().remove();
            $(this).next().nextAll().remove();
            if (!(fileInfoDiv.is(':empty'))){clearFileInfo()}
        }
    );
    dropDowns.on('select2:select', '.files',
         function(evt) {
             var selection_path = evt.params.data.element.id;
             irodsQuery(selection_path);
         }
    );
    dropDowns.on('select2:unselect', '.files',
        function() {
            $('[aria-expanded=true]').parent().parent().remove();
            if (!(fileInfoDiv.is(':empty'))){clearFileInfo()}
        }
    );
}); //end of page-ready code//

/**************************************
 ******HANDLE HYDROSHARE FORM******
 **************************************/

function clearUploadForm() {
    if (!($('#credentials-checkbox').is(":checked"))) {
        $('#hydro-username').val('');
        $('#hydro-password').val('');
    }
    $('#resource-abstract').val('');
    $('#resource-keywords')
        .val('')
        .tagsinput('removeAll');
    displayStatus
        .removeClass('error uploading success')
        .empty();
}

function tagChange(event) { //added to $('#resource-keywords') as an 'onclick' function in home.html
    var inputElement = $('.bootstrap-tagsinput').children('input');
    var itemClicked = event.target || event.srcElement;
    var itemId = itemClicked.id;
    var jqueryIdCall = '#' + itemId;
    if ($(jqueryIdCall).val() == "") {
        inputElement.attr('placeholder', 'Separate each keyword with a space or comma');
        inputElement.attr('style', 'width: 47em !important');
    } else {
        inputElement.removeAttr('placeholder');
        inputElement.attr('style','width: 6em !important');

    }
}

/************************************
 ******QUERY THE IRODS DATABASE******
 ************************************/

function irodsQuery(selectionPath) {
    downloadPath = '';

    //Query the iRODS database for the next branch of data
    $.ajax({
        type: 'GET',
        url: 'get-dropdown-contents',
        dataType:'json',
        data: {'selection_path': selectionPath},
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        },
        success: function (data) { //if the query succeeds and returns data...
            var folders = data.irods_data.folders;
            var files = data.irods_data.files;
            if (folders || files) { //check to see if the files or folders attributes have data
                var newDropDownData = folders.length == 0 ? files : folders;
                dropDowns.append(newDropDownData); //create the new dropdown box with its file/folder options
                var dropDownType = folders.length == 0 ? "files" : "folders";
                formatDropDown(dropDownType); //format the dropdown with file or folder pictures accordingly
            }
            else { //if there wasn't any data in the files or folders attributes, the selection was a file
                downloadPath = 'http://username:password@nfie.hydroshare.org:8080/irods-rest/rest/fileContents' +
                        selectionPath.slice(0, selectionPath.indexOf('?'));
                //prepare the upload form
                $('#resource-title').val(downloadPath.slice(downloadPath.lastIndexOf('/')+1)); //place the filename in the modal form

                if (downloadPath.indexOf('rapid') != -1 && downloadPath.indexOf('output') != -1) {
                    //$('#resource-type').val('Multidimensional (NetCDF)'); Currently not working. Will add once it has been fixed
                    var viewerButtonHref = "http://127.0.0.1:8000/apps/nfie-data-viewer?usr=null&src=iRODS&res_id=" + downloadPath;
                    console.log(viewerButtonHref);
                    viewerButton.attr('href', viewerButtonHref);
                    viewerButton.removeClass('hidden');
                } else {
                    $('#resource-type').val('Generic')
                }

                //show the appropriate buttons
                downloadButton.removeClass('hidden');
                uploadButton.removeClass('hidden');

                /********************************
                 ******FORMAT THE JSON DATA******
                 ********************************/

                //Format the fileSize to appropriate units (originally in bytes)
                var dataSize = data.irods_data.dataSize;
                var dataUnitsSwitchKey = 0;
                while (dataSize > 999) {
                    dataSize /= 1000;
                    dataUnitsSwitchKey++;
                }
                var dataUnitsSwitch = function(dataUnitsSwitchKey) {
                    var options = {
                        0: 'bytes',
                        1: 'kB',
                        2: 'MB',
                        3: 'GB',
                        4: 'TB',
                        5: 'PB'
                    };
                    return options[dataUnitsSwitchKey];
                };
                var dataUnits = dataUnitsSwitch(dataUnitsSwitchKey);
                data.irods_data.dataSize = dataSize.toFixed(2).toString() + " " + dataUnits;

                //Format the date (originally in milliseconds)
                data.irods_data.createdAt = new Date(data.irods_data.createdAt).toUTCString();
                data.irods_data.updatedAt = new Date(data.irods_data.updatedAt).toUTCString();

                //Build a table of the json data and place it in the file info html element
                fileInfoDiv.html(buildTable(data.irods_data));
                fileInfoDiv.prepend('<h3>File metadata:</h3>');
                fileInfoDiv.resize(); //resize the div

                //Format the table data headers with spaces and capitalization
                $('.td_head').each(function() {
                    var thisText = $(this).text();
                    var loopTotal = thisText.length;
                    for (var i=0; i < loopTotal; i++) {
                        if (/[^A-z]/.test(thisText.charAt(0))) {
                            thisText = thisText.slice(1);
                        }
                        if (/[A-Z]/.test(thisText.charAt(i))) {
                            thisText = thisText.slice(0, i) + " " + thisText.slice(i);
                            i++;
                        }
                    }
                    var newText = thisText.charAt(0).toUpperCase() + thisText.slice(1) + ":";
                    $(this).text(newText);
                });
                //remove any attributes that are empty
                $('.td_row').each(function () {
                    if (!($(this).html())) {
                        $(this).parent().parent().remove();
                    }
                });

                /***************************************
                 ******DOWNLOAD BUTTON CLICK EVENT******
                 ***************************************/
                downloadButton.off('click'); //remove any previous click function to clear the downloadPath variable
                downloadButton.on('click', function () { //create a new click event to initialize the downloadPath variable
                    window.open(downloadPath);
                });

                /***************************************
                 *******UPLOAD BUTTON CLICK EVENT*******
                 ***************************************/
                $('#hydroshare-proceed').on('click', function () {
                    $(this).prop('disabled', true);
                    displayStatus.removeClass('error');
                    displayStatus.addClass('uploading');
                    displayStatus.html('<em>Uploading...</em>');
                    var resourceTypeSwitch = function(typeSelection) {
                        var options = {
                            'Generic': 'GenericResource',
                            'Geographic Raster': 'RasterResource',
                            'HIS Referenced Time Series': 'RefTimeSeries',
                            'Model Instance': 'ModelInstanceResource',
                            'Model Program': 'ModelProgramResource',
                            //'Multidimensional (NetCDF)': 'NetcdfResource', not presently functional
                            'Time Series': 'TimeSeriesResource',
                            'Application': 'ToolResource'
                        };
                        return options[typeSelection];
                    };
                    var hydroUsername = $('#hydro-username').val();
                    var hydroPassword = $('#hydro-password').val();
                    var resourceAbstract = $('#resource-abstract').val();
                    var resourceTitle = $('#resource-title').val();
                    var resourceKeywords = $('#resource-keywords').val() ? $('#resource-keywords').val() : "";
                    var resourceType = resourceTypeSwitch($('#resource-type').val());

                    if (!hydroPassword || !hydroUsername) {
                        displayStatus.removeClass('uploading');
                        displayStatus.addClass('error');
                        displayStatus.html('<em>You must enter a username and password.</em>');
                        return;
                    }
                    $.ajax({
                        type: 'GET',
                        url: 'upload-to-hydroshare',
                        dataType:'json',
                        data: {
                                'download_path': downloadPath,
                                'hs_username': hydroUsername,
                                'hs_password': hydroPassword,
                                'r_title': resourceTitle,
                                'r_type': resourceType,
                                'r_abstract': resourceAbstract,
                                'r_keywords': resourceKeywords
                        },
                        success: function (data) {
                            debugger;
                            $('#hydroshare-proceed').prop('disabled', false);
                            if ('error' in data) {
                                displayStatus.removeClass('uploading');
                                displayStatus.addClass('error');
                                displayStatus.html('<em>' + data.error + '</em>');
                            } else {
                                displayStatus.removeClass('uploading');
                                displayStatus.addClass('success');
                                displayStatus.html('<em>File uploaded successfully!</em>');
                            }
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            $('#hydroshare-proceed').prop('disabled', false);
                            console.log(jqXHR + '\n' + textStatus + '\n' + errorThrown);
                            displayStatus.removeClass('uploading');
                            displayStatus.addClass('error');
                            displayStatus.html('<em>' + jqXHR + '</em>');
                        }
                    });
                });
            }
        }
    })
}

/***********************
FORMAT THE SELECT2 BOXES
 ***********************/
function formatDropDown(dropDownType) {
    if (dropDownType == "files") {
        $('.files').select2({
            placeholder: "Select a file",
            allowClear: true,
            minimumResultsForSearch: 7,
            templateResult: formatDropdownOptions,
            templateSelection: formatDropdownOptions
        });
    } else {
        $('.folders').select2({
            placeholder: "Select a folder",
            allowClear: true,
            minimumResultsForSearch: 7,
            templateResult: formatDropdownOptions,
            templateSelection: formatDropdownOptions
        });
    }
}

function formatDropdownOptions(state) {
    if (!state.id) {
        return state.text;
    }
    else if (state.element.id.indexOf("?COLLECTION") != -1) {
        return $('<span><img src="/static/nfie_irods_explorer/images/dir.svg" class="drop-down-icon" /> ' + state.text + '</span>');
    }
    return $('<span><img src="/static/nfie_irods_explorer/images/file.svg" class="drop-down-icon" /> ' + state.text + '</span>');
}



/*****************************************************
 ***********JSON TO TABLE CODE************************
 *****************************************************/
var td_class;

function buildTable(a) {
    var e = document.createElement("table"),
        d, b;
    if (isArray(a)) return buildArray(a);
    for (var c in a) {
        "object" != typeof a[c] || isArray(a[c]) ? "object" == typeof a[c] && isArray(a[c]) ?
        (d = e.insertRow(-1), b = d.insertCell(-1), b.colSpan = 2, b.innerHTML = '<div class="td_head">' +
            encodeText(c) + '</div><table style="width:100%">' + $(buildArray(a[c]), !1).html() + "</table>") :
        (d = e.insertRow(-1), b = d.insertCell(-1), b.innerHTML = "<div class='td_head'>" + encodeText(c) +
            "</div>", d = d.insertCell(-1), d.innerHTML = "<div class='td_row'>" +
            encodeText(a[c]) + "</div>") : (d = e.insertRow(-1), b = d.insertCell(-1), b.colSpan = 2, b.innerHTML = '<div class="td_head">' +
        encodeText(c) + '</div><table style="width:100%">' + $(buildTable(a[c]), !1).html() + "</table>");
    }
    return e
}

function buildArray(a) {
    var e = document.createElement("table"),
        d, b, c = !1,
        n = !1,
        l = {},
        g = -1,
        m = 0,
        k;
    k = "";
    if (0 == a.length) return "<div></div>";
    d = e.insertRow(-1);
    for (var f = 0; f < a.length; f++)
        if ("object" != typeof a[f] || isArray(a[f])) n ||
        (g += 1, n = !0, b = d.insertCell(g), l.empty = g, b.innerHTML = "<div class='td_head'>&nbsp;</div>");
        else
            for (var h in a[f]) k = "-" + h, k in l || (c = !0, g += 1, b = d.insertCell(g), l[k] = g, b.innerHTML = "<div class='td_head'>" + encodeText(h) + "</div>");
    c || e.deleteRow(0);
    m = g + 1;
    for (f = 0; f < a.length; f++)
        if (d = e.insertRow(-1), td_class = isEven(f) ? "td_row" : "td_row_odd", "object" != typeof a[f] || isArray(a[f]))
            if ("object" == typeof a[f] && isArray(a[f]))
                for (g = l.empty, c = 0; c < m; c++) b = d.insertCell(c), b.className = td_class, k = c == g ? '<table style="width:100%">' + $(buildArray(a[f]), !1).html() + "</table>" : " ", b.innerHTML = "<div class='" + td_class + "'>" + encodeText(k) + "</div>";
            else
                for (g = l.empty, c = 0; c < m; c++) b = d.insertCell(c), k = c == g ? a[f] : " ", b.className = td_class, b.innerHTML = "<div class='" + td_class + "'>" + encodeText(k) + "</div>";
    else {
        for (c = 0; c < m; c++) b =
            d.insertCell(c), b.className = td_class, b.innerHTML = "<div class='" + td_class + "'>&nbsp;</div>";
        for (h in a[f]) c = a[f], k = "-" + h, g = l[k], b = d.cells[g], b.className = td_class, "object" != typeof c[h] || isArray(c[h]) ? "object" == typeof c[h] && isArray(c[h]) ? b.innerHTML = '<table style="width:100%">' + $(buildArray(c[h]), !1).html() + "</table>" : b.innerHTML = "<div class='" + td_class + "'>" + encodeText(c[h]) + "</div>" : b.innerHTML = '<table style="width:100%">' + $(buildTable(c[h]), !1).html() + "</table>"
    }
    return e
}

function encodeText(a) {
    return $("<div />").text(a).html()
}

function isArray(a) {
    return "[object Array]" === Object.prototype.toString.call(a)
}

function isEven(a) {
    return 0 == a % 2
}