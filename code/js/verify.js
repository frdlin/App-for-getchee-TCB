var isOnline;

// 等待加載PhoneGap
document.addEventListener("deviceready", onDeviceReady, false);
// PhoneGap加載完畢
function onDeviceReady() {
    //alert(document.documentElement.clientWidth + ',' + document.documentElement.clientHeight);
    sqlitesync_DB = createDBConnection();

    $('.doSync').addClass('ui-disabled');
    isOnline = checkInternet();

    checkOfflineDB(offlineDBOK, offlineDBFalse);
    function offlineDBOK() {
        if (isOnline)
            $('.doSync').removeClass('ui-disabled');
        //checkMustSync(mustSync);
        //function mustSync() {
        //    $('.doSync').removeClass('ui-disabled');
        //}
    }
    function offlineDBFalse() {
        // 要執行 initialize
        //alert('onDeviceReady');
        startInitDB(true);
    }

    document.addEventListener("online", onOnline, false);
    document.addEventListener("offline", onOffline, false);
    function onOnline() {
        isOnline = true;
        checkOfflineDB(offlineDBOK);
        function offlineDBOK() {
            $('.doSync').removeClass('ui-disabled');
            //checkMustSync(mustSync);
            //function mustSync() {
            //    $('.doSync').removeClass('ui-disabled');
            //}
        }
    }
    function onOffline() {
        $('.doSync').addClass('ui-disabled');
        isOnline = false;
    }

    document.addEventListener("backbutton", myBack, false);
    function myBack(e) {
        var page = $.mobile.activePage.attr('id');
        //alert('page: ' + page);
        if (page == 'selectAddress' ||
            page == 'syncLogPage') {
            e.preventDefault();
            //navigator.notification.confirm("Are you sure you want to exit ?", onConfirm, "Confirmation", "Yes,No");
            if (confirm('Are you sure you want to exit ?')) navigator.app.exitApp();
        }
        else
            window.history.back();

        //            function onConfirm(button) {
        //                if (button == 1) {//If User selected No, then we just do nothing
        //                    navigator.app.exitApp(); // Otherwise we quit the app.
        //                }
        //                else
        //                    return;
        //            }
    }
}

$(document).on("vclick", ".doSync", doSync);

$(document).on('pageshow', '#loginPage', function () {
    //checkOfflineDB(offlineDBOK, offlineDBFalse)

    //function offlineDBOK() {
    getAgt_Id(getAgt_IdOK);

    function getAgt_IdOK() {
        //alert('getAgt_IdOK');
        //checkNFC();
        if (agt_id != '')
            checkPassword();
        else if (!isOnline) {
            alert('Please check your internet connection');
            $.mobile.changePage('#loginPage', { allowSamePageTransition: true });
        }
        else
            $.mobile.changePage("#setAgentDialog", { role: "dialog" });
        //startApp();
    }
    //}
    //function offlineDBFalse() {
    // 要執行 initialize
    //    startInitDB(true);
    //}

    // 用 NFC 登入
    function checkNFC() {
        // Read NDEF formatted NFC Tags
        nfc.addNdefListener(
        function (nfcEvent) {
            $.unblockUI();
            var tag = nfcEvent.tag,
                ndefMessage = tag.ndefMessage;

            // dump the raw json of the message
            // note: real code will need to decode
            // the payload from each record
            //alert('ndefMessage : ' + JSON.stringify(ndefMessage));

            // assuming the first record in the message has 
            // a payload that can be converted to a string.
            //alert('ndefMessage[0].payload : ' + nfc.bytesToString(ndefMessage[0].payload).substring(3));
            //alert('ndefMessage[0].payload : ' + nfc.bytesToString(ndefMessage[0].payload));

            //agt_id = nfc.bytesToString(ndefMessage[0].payload).substring(3);
            var newAgt_id = nfc.bytesToString(ndefMessage[0].payload).substring(ndefMessage[0].payload[0] + 1);

            if (agt_id != newAgt_id) {
                // 換 Agent
                agt_id = newAgt_id;
                setAgt_Id(setAgt_IdOK);
            }
            else
                startVerify();

            function setAgt_IdOK() {
                // 需要重新 Sync
                if (isOnline) {
                    $('.doSync').removeClass('ui-disabled');
                    myDBSync(myDBSyncOK);
                }
                else {
                    alert('Please check your internet connection');
                    navigator.app.exitApp();
                }
                function myDBSyncOK() {
                    //$('.doSync').addClass('ui-disabled');

                    alert("Set agt_id (" + agt_id + ") success");

                    startVerify();
                }
            }
        },
        function () { // success callback
            //alert("Waiting for NDEF tag");
            $.blockUI({ message: 'Waiting for NDEF tag' });
        },
        function (error) { // error callback
            alert("Error adding NDEF listener " + JSON.stringify(error));
        }
    );
    }

    function checkPassword() {
        //return;
        var agtPass = prompt('Enter password for agent ' + agt_id + ' : ', '');

        if (agtPass == null) {
            navigator.app.exitApp();
        }
        else {
            var de = encode64(utf16to8(agtPass));

            sqlitesync_DB.transaction(function (tx) {
                tx.executeSql("Select * From [Agent] Where [Name]=? and [Password]=?;",
                        [agt_id, de], checkAgentSuccess, errorCheckAgent);

                function errorCheckAgent(err) {
                    alert('Check agent error.' + 'Error processing SQL: ' + err.code);
                    //console.log("Error processing SQL: " + err.code);
                    //navigator.notification.alert('Check Table error.', checkInternet, 'checkTable', 'OK');
                }
                function checkAgentSuccess(tx, results) {
                    if (results.rows.length > 0) {
                        //startApp();
                        startVerify();
                    }
                    else {
                        alert('Password error!');
                        navigator.app.exitApp();
                    }
                }
            });
        }
    }

    function startVerify() {
        //window.location.replace('verify.html#verify');
        //window.location.replace('verify.html#selectAddress');
        //window.location.assign('verify.html#selectAddress');
        //document.location.href = 'verify.html#selectAddress';
        //window.location = 'verify.html#selectAddress';
        $.mobile.changePage("#selectAddress");
    }
});

$(document).on('pageinit', '#setup', function () {
    $(document).on("vclick", "#initialize", function (e) {
        startInitDB(false);
    });
});

$(document).on('pageshow', '#setup', function () {
    //alert('setup pageshow');

    // 檢查是否有 Internet
    //if (checkInternet()) {
    if (isOnline) {
        //alert('isOnline');
        $('#initialize').removeClass('ui-disabled');
        $('#setAgent').removeClass('ui-disabled');

        // 檢查是否有必須 Sync 的資料
        checkMustSync(MustSync);
    }
    else {
        //alert('not isOnline');
        $('#initialize').addClass('ui-disabled');
        $('#setAgent').addClass('ui-disabled');
    }

    function MustSync() {
        //alert('MustSync');
        $('#initialize').addClass('ui-disabled');
        $('#setAgent').addClass('ui-disabled');
    }
});

$(document).on('pageinit', '#setAgentDialog', function () {
    $(document).on("vclick", "#setAgt_Id", function (e) {
        //$('#setAgt_Id').click(function () {
        if (!isOnline)
            alert('Please check your internet connection');
        else {
            if (agt_id == $('#agt_id').val()) {
                alert('Agent has not change');
            }
            else {
                var de = encode64(utf16to8($('#agtPass').val()));

                sqlitesync_DB.transaction(function (tx) {
                    tx.executeSql("Select * From [Agent] Where [Name]=? and [Password]=?;",
                        [$('#agt_id').val(), de], checkAgentSuccess, errorCheckAgent);
                });
            }
        }

        function errorCheckAgent(err) {
            alert('Check agent error.' + 'Error processing SQL: ' + err.code);
            //console.log("Error processing SQL: " + err.code);
        }
        function checkAgentSuccess(tx, results) {
            if (results.rows.length > 0) {
                agt_id = $('#agt_id').val();
                $('.surveyor_id').text(agt_id);

                if (agt_id == '') {
                    $('.doSync').addClass('ui-disabled');
                }
                else {
                    $('.doSync').removeClass('ui-disabled');

                    setAgt_Id(setAgt_IdOK);
                }
            }
            else {
                alert('Password error!');
            }

            function setAgt_IdOK() {
                lastUpdateTime = '1900-1-1';
                myDBSync(myDBSyncOK);
                function myDBSyncOK() {
                    //$('.doSync').addClass('ui-disabled');
                    offlineGetLocationListByStatus();
                    history.go(-1);
                }
            }
        }
    });
});

$(document).on('pageinit', '#verify', function () {
    //TCB Vietnam Begin
    $('#met_customer').change(function () {
        if ($(this).val() == 'no') {
            $('#q1_3_1').show();
            $('#q1_3_2').hide();
        } else {
            $('#q1_3_1').hide();
            $('#q1_3_2').show();
        }
    });

    $('#type_of_loan').change(function () {
        if ($(this).val() == 'no') {
            $('#q1_5_1').show();
            $('#q1_5_2').hide();
        } else {
            $('#q1_5_1').hide();
            $('#q1_5_2').show();
        }
    });

    $('#current_job').change(function () {
        if ($(this).val() == 'no') {
            $('#q1_6').hide();
        } else {
            $('#q1_6').show();
        }
    });

    $('#reason_of_overdue_debt').change(function () {
        if ($(this).val() == 'other') {
            $('#q1_8').show();
        } else {
            $('#q1_8').hide();
        }
    });

    $('#collateral_status').change(function () {
        if ($(this).val() == 'status_is_the_same') {
            $('#q1_10').hide();
        } else {
            $('#q1_10').show();
        }
    });

    //TCB Vietnam End


    $('#verify_hidden').show();
    $('#divstartVerify').show();
    $('#divsurv_psn_others').hide();

    $('#surv_psn').change(function () {
        psnChange($(this).val());
        //            if ($(this).val() == "Others") {
        //                $('#divsurv_psn_others').show();
        //            } else {
        //                $('#divsurv_psn_others').hide();
        //            }
    });

    $('#obj_vst_yn').change(function () {
        vstChange($(this).val());
        //            if ($(this).val() == "Yes") {
        //                $('#a4_2a, #q6, #q7_1a').show();
        //                $('#a4_2b, #a6_2, #q7_1c').hide();
        //                $("#res_yn").val("Yes").selectmenu('refresh', true);
        //            } else {
        //                $('#a4_2a, #q6, #q7_1a, #q7_1b').hide();
        //                $('#a4_2b, #q7_1c').show();
        //            }
    });

    $('#res_yn').change(function () {
        resChange($(this).val());
//            if ($(this).val() == "No") {
//                $('#a6_2, #res_n_des, #q7_1b').show();
//                $('#q7_1a').hide();
//            } else {
//                $('#a6_2, #resin, #q7_1b').hide();
//                $('#q7_1a').show();
//            }
    });

    $("#adl1_name").change(
	function () {
		$("#adl5_name").empty();
		$("#adl5_name").prepend("<option value='0'>Select LGA / District</option>");
		$("#adl5_name")[0].selectedIndex = 0;
		$("#adl5_name").selectmenu('refresh', true);

		$("#address_e").empty();
		$("#address_e").prepend("<option value='0'>Select Address</option>");
		$("#address_e")[0].selectedIndex = 0;
		$("#address_e").selectmenu('refresh', true);

		clearLocationData();

		if ($("#adl1_name").val() == "0") {
		}
		else {
		    offlineGetDistrictList();
		}

		function offlineGetDistrictList() {
		    //var sql = "SELECT TownID, Town FROM Towns Where CityID=" + $("#City").val() + " Order By TownID;";
		    //alert(sql);
		    //alert('City : ' + $("#City").val());
		    sqlitesync_DB.transaction(function (tx) {
		        tx.executeSql("SELECT [adl5_name] FROM [District] Where [adl1_name]=? and [adl5_name] in (select distinct [adl5_name] From [Location] where [agt_id]=? and [adl1_name]=?) Order By adl5_name;",
                                [$("#adl1_name").val(), agt_id, $("#adl1_name").val()], getDistrictSuccess, errorGetDistrict);
		    });

		    function errorGetDistrict(err) {
		        alert('Get district list error.' + 'Error processing SQL: ' + err.code);
		        //console.log("Error processing SQL: " + err.code);
		    }
		    function getDistrictSuccess(tx, results) {
		        if (results.rows.length == 0) {
		            //navigator.notification.alert('Table store not exist.', nullAlert, 'Check Table', 'OK');
		            alert('No district list found.\nPlease Goto Data Manager to initialize and sync');
		        }
		        else {
		            //navigator.notification.alert('Table store exist.', nullAlert, 'Check Table', 'OK');
		            //alert('Table ' + checkTable + ' exist.');
		            for (i = 0; i < results.rows.length; i++) {
		                $("#adl5_name").append("<option value='" + results.rows.item(i).adl5_name + "'>" + results.rows.item(i).adl5_name + "</option>");
		            }
		        }
		    }
		}

		function onlineGetDistrictList() {
		    $.blockUI();
		    Url = UrlBase + ServiceName + "/GetDistrictList";
		    Data = '{"adl1_name": "' + $("#adl1_name").val() + '"}';
		    ContentType = "application/json; charset=utf-8";
		    DataType = "json";
		    //ProcessData = true;

		    $.support.cors = true;

		    $.ajax({
		        type: Type, //GET or POST or PUT or DELETE verb
		        url: Url, // Location of the service
		        data: Data, //Data sent to server
		        contentType: ContentType, // content type sent to server
		        dataType: DataType, //Expected data format from server
		        //processdata: ProcessData, //True or False
		        timeout: ajaxTimeout,
		        success: function (msg) {//On Successfull service call
		            $.unblockUI();

		            var DistrictListInfo = JSON.parse(msg.GetDistrictListResult);
		            if (DistrictListInfo.msg == "OK") {
		                //alert('OK\n' + DistrictListInfo.DistrictList.length);
		                for (i = 0; i < DistrictListInfo.DistrictList.length; i++) {
		                    $("#adl5_name").append("<option value='" + DistrictListInfo.DistrictList[i].adl5_name + "'>" + DistrictListInfo.DistrictList[i].adl5_name + "</option>");
		                }
		            }
		            else
		                alert(DistrictListInfo.msg);
		        },
		        error: AjaxError
		    });
		}
	});

    $("#adl5_name").change(
	function () {
		$("#address_e").empty();
		$("#address_e").prepend("<option value='0'>Select Address</option>");
		$("#address_e")[0].selectedIndex = 0;
		$("#address_e").selectmenu('refresh', true);

		clearLocationData();

		if ($("#adl5_name").val() == "0") {
		}
		else {
		    offlineGetLocationList();
		}

		function offlineGetLocationList() {
		    sqlitesync_DB.transaction(function (tx) {
		        tx.executeSql("SELECT objid, address_e FROM Location Where agt_id=? and adl1_name=? and adl5_name=? Order By address_e;",
                                [agt_id, $("#adl1_name").val(), $("#adl5_name").val()], getLocationSuccess, errorGetLocation);
		    });

		    function errorGetLocation(err) {
		        alert('Get location list error.' + 'Error processing SQL: ' + err.code);
		        //console.log("Error processing SQL: " + err.code);
		    }
		    function getLocationSuccess(tx, results) {
		        if (results.rows.length == 0) {
		            //navigator.notification.alert('Table store not exist.', nullAlert, 'Check Table', 'OK');
		            alert('No location list found.\nPlease Goto Data Manager to Sync and set Surveyor ID');
		        }
		        else {
		            //navigator.notification.alert('Table store exist.', nullAlert, 'Check Table', 'OK');
		            //alert('Table ' + checkTable + ' exist.');
		            for (i = 0; i < results.rows.length; i++) {
		                $("#address_e").append("<option value='" + results.rows.item(i).objid + "'>" + results.rows.item(i).address_e + "</option>");
		            }
		        }
		    }
		}

		function onlineGetLocationList() {
		    $.blockUI();
		    Url = UrlBase + ServiceName + "/GetLocationList";
		    Data = '{"agt_id" : "' + agt_id + '", ' +
                    '"adl1_name": "' + $("#adl1_name").val() + '", ' +
                    '"adl5_name": "' + $("#adl5_name").val() + '"}';
		    ContentType = "application/json; charset=utf-8";
		    DataType = "json";
		    //ProcessData = true;

		    $.support.cors = true;

		    $.ajax({
		        type: Type, //GET or POST or PUT or DELETE verb
		        url: Url, // Location of the service
		        data: Data, //Data sent to server
		        contentType: ContentType, // content type sent to server
		        dataType: DataType, //Expected data format from server
		        //processdata: ProcessData, //True or False
		        timeout: ajaxTimeout,
		        success: function (msg) {//On Successfull service call
		            $.unblockUI();

		            var LocationListInfo = JSON.parse(msg.GetLocationListResult);
		            if (LocationListInfo.msg == "OK") {
		                //alert('OK\n' + LocationListInfo.LocationList.length);
		                for (i = 0; i < LocationListInfo.LocationList.length; i++) {
		                    $("#objid").append("<option value='" + LocationListInfo.LocationList[i].objid + "'>" + LocationListInfo.LocationList[i].objid + "</option>");
		                }
		            }
		            else
		                alert(LocationListInfo.msg);
		        },
		        error: AjaxError
		    });
		}
	});

    $("#address_e").change(
	function () {
		clearLocationData();
		//console.log('rd_s_asph length : ' + $('#rd_s_asph option').length + ', index : ' + $("#rd_s_asph").find(":selected").index() + ', rd_s_asph val : ' + $('#rd_s_asph').find(":selected").val() + ', rd_s_asph text : ' + $('#rd_s_asph').find(":selected").text());

		if ($("#address_e").val() == "0") {
		}
		else {
		    //$('#address_e_1').val($("#address_e").find(":selected").text());
		    //offlineGetLocationInfo();

		    selectObjid($("#address_e").val(), $("#address_e").find(":selected").text());
		}

		function offlineGetLocationInfo() {
		    $.blockUI();
		    sqlitesync_DB.transaction(function (tx) {
		        tx.executeSql("SELECT [clt_id], [name_e], [address_e], [x_lat], [y_long], [busstop], [polic], [landmark], [rd_s_asph], [lu_type], [surv_psn], [surv_psn_others], [cmt_tgt], [obj_vst_yn]," +
                                " [objv_y_des], [objv_n_des], [res_yn], [res_n_des], [cmt_res_y], [cmt_v_name], [cmt_nofind], [note], strftime('%Y-%m-%d %H:%M:%S', [startTime]) as [startTime], [flag] " +
                                "FROM [Location] Where [agt_id]=? and [adl1_name]=? and [adl5_name]=? and [objid]=? Order By [objid];",
                                [agt_id, $("#adl1_name").val(), $("#adl5_name").val(), $("#address_e").val()], getLocationInfoSuccess, errorGetLocationInfo);
		    });

		    function errorGetLocationInfo(err) {
		        $.unblockUI();
		        alert('Get location info error.' + 'Error processing SQL: ' + err.code);
		        //console.log("Error processing SQL: " + err.code);
		    }
		    function getLocationInfoSuccess(tx, results) {
		        if (results.rows.length == 0) {
		            $.unblockUI();
		            //navigator.notification.alert('Table store not exist.', nullAlert, 'Check Table', 'OK');
		            alert('No location info found.\nPlease Goto Data Manager to sync');
		        }
		        else {
		            clt_id = results.rows.item(0).clt_id;
		            $("#objid").val($("#address_e").val());
		            $("#name_e").val(results.rows.item(0).name_e);
		            //$("#address_e").val(results.rows.item(0).address_e);
		            $("#x_lat").val(results.rows.item(0).x_lat);
		            $("#y_long").val(results.rows.item(0).y_long);

		            startTime = results.rows.item(0).startTime;
		            //console.log('startTime : ' + startTime);
		            // 檢查是否讀取到 GPS
		            if ($("#x_lat").val() != '' && $("#y_long").val() != '') {
		                //if (startTime == '1900-01-01 00:00:00' || startTime == null) startTime = dateTimeToStr(new Date());
		                if (startTime == '1900-01-01 00:00:00' || startTime == null) startTime = dateTimeToUTCStr(new Date());
		                $("#verify_hidden").show();
		                $('#divstartVerify').hide();
		            }
		            //console.log(startTime == '1900-01-01 00:00:00' || startTime == null);
		            //console.log('startTime : ' + startTime);

		            $("#busstop").val(results.rows.item(0).busstop);
		            $("#polic").val(results.rows.item(0).polic);
		            $("#landmark").val(results.rows.item(0).landmark);

		            //console.log('rd_s_asph from sqlite : ' + results.rows.item(0).rd_s_asph);

		            // select
		            $("#rd_s_asph").val(results.rows.item(0).rd_s_asph).selectmenu('refresh', true);
		            $("#lu_type").val(results.rows.item(0).lu_type).selectmenu('refresh', true);
		            $("#surv_psn").val(results.rows.item(0).surv_psn).selectmenu('refresh', true);

		            $("#surv_psn_others").val(results.rows.item(0).surv_psn_others);

		            // select
		            $("#cmt_tgt").val(results.rows.item(0).cmt_tgt).selectmenu('refresh', true);
		            $("#obj_vst_yn").val(results.rows.item(0).obj_vst_yn).selectmenu('refresh', true);

		            $("#objv_y_des").val(results.rows.item(0).objv_y_des);
		            $("#objv_n_des").val(results.rows.item(0).objv_n_des);

		            // select
		            $("#res_yn").val(results.rows.item(0).res_yn).selectmenu('refresh', true);

		            $("#res_n_des").val(results.rows.item(0).res_n_des);
		            $("#cmt_res_y").val(results.rows.item(0).cmt_res_y);
		            $("#cmt_v_name").val(results.rows.item(0).cmt_v_name);
		            $("#cmt_nofind").val(results.rows.item(0).cmt_nofind);
		            $("#note").val(results.rows.item(0).note);

		            getLocationPhoto(0);
		        }
		    }
		}

		function onlineGetLocationinfo() {
		    $.blockUI();
		    Url = UrlBase + ServiceName + "/GetLocationInfo";
		    Data = '{"agt_id" : "' + agt_id + '", ' +
                    '"adl1_name": "' + $("#adl1_name").val() + '", ' +
                    '"adl5_name": "' + $("#adl5_name").val() + '", ' +
                    '"objid" : "' + $("#objid").val() + '"}';
		    ContentType = "application/json; charset=utf-8";
		    DataType = "json";
		    //ProcessData = true;

		    $.support.cors = true;

		    $.ajax({
		        type: Type, //GET or POST or PUT or DELETE verb
		        url: Url, // Location of the service
		        data: Data, //Data sent to server
		        contentType: ContentType, // content type sent to server
		        dataType: DataType, //Expected data format from server
		        //processdata: ProcessData, //True or False
		        timeout: ajaxTimeout,
		        success: function (msg) {//On Successfull service call
		            $.unblockUI();

		            var LocationInfo = JSON.parse(msg.GetLocationInfoResult);
		            if (LocationInfo.msg == "OK") {
		                //alert('OK\n' + LocationListInfo.LocationList.length);
		                clt_id = LocationInfo.LocationInfo.clt_id;
		                $("#name_e").val(LocationInfo.LocationInfo.name_e);
		                $("#address_e").val(LocationInfo.LocationInfo.address_e);
		                $("#x_lat").val(LocationInfo.LocationInfo.x_lat);
		                $("#y_long").val(LocationInfo.LocationInfo.y_long);

		                // 檢查是否讀取到 GPS
		                if ($("#x_lat").val() != '' && $("#y_long").val() != '') {
		                    $("#verify_hidden").show();
		                    $('#divstartVerify').hide();
		                }

		                $("#busstop").val(LocationInfo.LocationInfo.busstop);
		                $("#polic").val(LocationInfo.LocationInfo.polic);
		                $("#landmark").val(LocationInfo.LocationInfo.landmark);

		                // select
		                $("#rd_s_asph").val(LocationInfo.LocationInfo.rd_s_asph);
		                $("#lu_type").val(LocationInfo.LocationInfo.lu_type);
		                $("#surv_psn").val(LocationInfo.LocationInfo.surv_psn);

		                $("#surv_psn_others").val(LocationInfo.LocationInfo.surv_psn_others);

		                // select
		                $("#cmt_tgt").val(LocationInfo.LocationInfo.cmt_tgt);
		                $("#obj_vst_yn").val(LocationInfo.LocationInfo.lu_type);

		                $("#objv_y_des").val(LocationInfo.LocationInfo.objv_y_des);
		                $("#objv_n_des").val(LocationInfo.LocationInfo.objv_n_des);

		                // select
		                $("#res_yn").val(LocationInfo.LocationInfo.res_yn);

		                $("#res_n_des").val(LocationInfo.LocationInfo.res_n_des);
		                $("#cmt_res_y").val(LocationInfo.LocationInfo.cmt_res_y);
		                $("#cmt_v_name").val(LocationInfo.LocationInfo.cmt_v_name);
		                $("#cmt_nofind").val(LocationInfo.LocationInfo.cmt_nofind);
		                $("#note").val(LocationInfo.LocationInfo.note);
		            }
		            else
		                alert(LocationInfo.msg);
		        },
		        error: AjaxError
		    });
		}
	});

    $(document).on("vclick", "#Get_FromAddress", function (e) {
        //$("#Get_FromAddress").click(
        //	function () {
        if ($("#address_e").val() == '0')
            alert('Please select Address');
        else {
            //address = $("City option:selected").text() + $("TownShip option:selected").text() + $("#address").val();
            var state = $("#adl1_name").val() == "0" ? "" : $("#adl1_name").find("option:selected").text();
            var district = $("#adl5_name").val() == "0" ? "" : $("#adl5_name").find("option:selected").text();
            //address = $("#City").find("option:selected").text() + $("#TownShip").find("option:selected").text() + $("#address").val();
            address = state + ' ' + district + ' ' + $("#address_e").val();
            if (state.length + district.length + $("#address_e").val().length == 0) {
                alert('No address');
                return;
            }
            //alert(address);
            $.blockUI({ message: '<h1>Get position by address</h1>' });
            geocoder = new google.maps.Geocoder();
            geocoder.geocode(
			{
			    'address': address
			}, function (results, status) {
			    $.unblockUI();

			    $("#x_lat").val('');
			    $("#y_long").val('');

			    if (status == google.maps.GeocoderStatus.OK) {
			        LatLng = results[0].geometry.location;
			        $("#x_lat").val(LatLng.lat());
			        $("#y_long").val(LatLng.lng());

			        alert(results[0].formatted_address);
			    }
			    else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
			        alert('ZERO RESULTS');
			        //alert('地理編碼成功，但是並未傳回任何結果');
			    }
			    else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
			        alert('OVER QUERY LIMIT');
			        //alert('超過配額了');
			    }
			    else if (status == google.maps.GeocoderStatus.REQUEST_DENIED) {
			        alert('REQUEST DENIED');
			        //alert('要求因為某些理由已遭到拒絕');
			    }
			    else if (status == google.maps.GeocoderStatus.INVALID_REQUEST) {
			        alert('INVALID REQUEST');
			        //alert('查詢遺失了');
			    }
			});
        }
    });

    $(document).on("vclick", "#Get_FromGPS", function (e) {
        //$("#Get_FromGPS").click(
        //	function () {
        if ($("#address_e").val() == '0')
            alert('Please select Address');
        else {
            getPosFromGPS(getGPSOK);

            //$.blockUI({ message: '<h1>Get position</h1>' });

            // 只透過手機 GPS 取座標
            //navigator.geolocation.getCurrentPosition(onSuccess, onError, { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
        }
        function getGPSOK(coords) {
            lat = coords.latitude;
            lon = coords.longitude;
            accuracy = coords.accuracy;
            altitude = coords.altitude;
            altitudeAccuracy = coords.altitudeAccuracy;

            //alert(coords.latitude + ',' + coords.longitude);
            $("#x_lat").val(coords.latitude);
            $("#y_long").val(coords.longitude);
            //alert(coords.latitude + ',' + coords.longitude);

            if (enableOfflineMap) {
                locName = $("#objid").val();
                $.mobile.changePage("#offlineMap", { transition: "slideup", changeHash: true });
            }
        }
        function getGPSFalse() {
            alert('Get position false !!');
        }
        // 獲取位置信息成功時調用的回調函數
        //        function onSuccess(position) {
        //            //$('#Get_FromGPS').button('enable');
        //            $.unblockUI();

        //            $("#x_lat").val(position.coords.latitude);
        //            $("#y_long").val(position.coords.longitude);
        //            //document.getElementById('longitude').value = position.coords.longitude;
        //            //document.getElementById('latitude').value = position.coords.latitude;

        //            // 傳回的 GPS 資訊
        //            //var element = document.getElementById('geolocation');
        //            //element.innerHTML = 'Latitude: '           + position.coords.latitude              + '<br />' +
        //            //					'Longitude: '          + position.coords.longitude             + '<br />' +
        //            //					'Altitude: '           + position.coords.altitude              + '<br />' +
        //            //					'Accuracy: '           + position.coords.accuracy              + '<br />' +
        //            //					'Altitude Accuracy: '  + position.coords.altitudeAccuracy      + '<br />' +
        //            //					'Heading: '            + position.coords.heading               + '<br />' +
        //            //					'Speed: '              + position.coords.speed                 + '<br />' +
        //            //					'Timestamp: '          + new Date(position.timestamp)          + '<br />';
        //        }

        //        // onError回調函數接收一個PositionError對象
        //        function onError(error) {
        //            //$('#Get_FromGPS').button('enable');

        //            $.unblockUI();
        //            //alert('code: ' + error.code + '\n' +
        //            //'message: ' + error.message + '\n');
        //            alert(error.message);
        //        }
    });

    $(document).on("vclick", "#startVerify", function (e) {
        //$("#startVerify").click(
        //	function () {
        var msg = '';
        // 檢查是否選了 Reference Number
        if ($("#address_e").val() == '0')
            msg += 'Please select Address\n';
        // 檢查是否讀取到 GPS
        if ($("#x_lat").val() == '' || $("#y_long").val() == '')
            msg += 'Please get Coordinate\n';

        if (msg == '') {
            //if (startTime == '1900-01-01 00:00:00' || startTime == null) startTime = dateTimeToStr(new Date());
            if (startTime == '1900-01-01 00:00:00' || startTime == null) startTime = dateTimeToUTCStr(new Date());
            $("#verify_hidden").show();
            $('#divstartVerify').hide();
        }
        else
            alert(msg);
    });

    $(document).on("vclick", "#takePhoto", function (e) {
        //$("#takePhoto").click(
        //    function () {
        var photoData;
        var x_lat, y_long;

        if (!checkLocationData()) return;

        getPhoto();

        function checkLocationData() {
            // 先檢查資料是否輸入完整
            var errmsg = "";
            if ($("#objid").val() == "0")
                errmsg += 'Please select Reference Number\n';

            if (errmsg.length > 0) {
                errmsg = errmsg.substring(0, errmsg.length - 1);
                alert(errmsg);
                return false;
            }

            return true;
        }

        // 呼叫相機拍照
        function getPhoto() {
            navigator.camera.getPicture(onTakePhotoSuccess, onTakePhotoFail,
        {
            quality: 50,
            destinationType: Camera.DestinationType.DATA_URL,
            correctOrientation: true
        });

            function onTakePhotoSuccess(imageData) {
                photoData = imageData;

                // 把照片顯示在下方
                //var image = document.getElementById('smallImage');
                //image.src = "data:image/jpeg;base64," + imageData;
                //image.style.display = 'block';
                //$("#photoMemo").val($("#photoNotes").val());
                //console.log('photo size : ' + imageData.length);

                //$("#smallImage").src = "data:image/jpeg;base64," + imageData;

                getLocation();
            }

            function onTakePhotoFail(message) {
                alert('Failed because: ' + message);
            }
        }

        // 拍照之後取得目前座標
        function getLocation() {
            $.blockUI({ message: '<h1>Get position</h1>' });
            navigator.geolocation.getCurrentPosition(onGetLocationSuccess, onGetLocationError, { maximumAge: 3000, timeout: 60000, enableHighAccuracy: true });

            // 獲取位置信息成功時調用的回調函數
            function onGetLocationSuccess(position) {
                x_lat = position.coords.latitude;
                y_long = position.coords.longitude;
                //console.log(x_lat + ',' + y_long);

                savePhotoToLocalDB();
            }

            // onError回調函數接收一個PositionError對象
            function onGetLocationError(error) {
                $.unblockUI();
                //console.log('GetLocation error code: ' + error.code + '\n' + 'message: ' + error.message);
                alert(error.message);
            }
        }

        // 把照片資料寫入 local DB : photo 中
        function savePhotoToLocalDB() {
            $.unblockUI();
            $.blockUI({ message: '<h1>Save photo</h1>' });
            sqlitesync_DB.transaction(function (tx) {
                //console.log('savePhotoToLocalDB');
                tx.executeSql('Insert Into photo([clt_id], [objid], [photoData], [name_e], [notes], [x_lat], [y_long], [photoTime]) Values(?, ?, ?, ?, ?, ?, ?, ?)',
                                [clt_id,
                                $("#objid").val(),
                                photoData,
                                $("#name_e").val(),
                                $("#pic_note").val(),
                                x_lat,
                                y_long,
                                dateTimeToUTCStr(new Date())],
                                savePhotoSuccess, errorSavePhoto);
            });
            function errorSavePhoto(err) {
                $.unblockUI();
                alert('Save photo error.' + 'Error processing SQL: ' + err.code);
                //console.log("errorSavePhoto  Error processing SQL: " + err.code);
            }
            function savePhotoSuccess(tx, results) {
                alert('Save photo successful');
                if (isOnline) $('.doSync').removeClass('ui-disabled');
                //console.log('Save photo successful');
                $("#pic_note").val('')

                getLocationPhoto(LocationPhotoCount);
            }
        }
    });

    $(document).on("vclick", "#Prev", function (e) {
        //$("#Prev").click(
        //	function () {
        //console.log('Prev');
        if (LocationPhotoIndex == 0) return;
        LocationPhotoIndex--;
        checkPhotoNav();
    });

    $(document).on("vclick", "#Next", function (e) {
        //$("#Next").click(
        //	function () {
        //console.log('Next');
        if (LocationPhotoIndex == LocationPhotoCount - 1) return;
        LocationPhotoIndex++;
        checkPhotoNav();
    });

    $(document).on("vclick", "#Delete", function (e) {
        //$("#Delete").click(
        //	function () {
        //console.log('Remove photo');
        if (LocationPhotoCount == 0) return;
        if (confirm('Remove photo ?')) {
            sqlitesync_DB.transaction(function (tx) {
                tx.executeSql("Delete From [photo] Where [clt_id]=? and [objid]=? and [photoTime]=?;",
                                [clt_id, $("#objid").val(), LocationPhotoTime[LocationPhotoIndex]], removeLocationPhotoSuccess, errorRemoveLocationPhoto);
            });
        }

        function errorRemoveLocationPhoto(err) {
            alert('Remove location photo error.' + 'Error processing SQL: ' + err.code);
            //console.log("Error processing SQL: " + err.code);
        }
        function removeLocationPhotoSuccess(tx, results) {
            // 從 array 中移除
            LocationPhoto.splice(LocationPhotoIndex, 1);
            LocationPhotoNote.splice(LocationPhotoIndex, 1);
            LocationPhotoTime.splice(LocationPhotoIndex, 1);

            // 更新 photo
            LocationPhotoIndex--;
            LocationPhotoCount--;
            if (LocationPhotoIndex < 0) LocationPhotoIndex = 0;
            checkPhotoNav();
        }
    });

    $(document).on("vclick", "#submit", function (e) {
        //$("#submit").click(
        //    function () {
        if (!confirm('Save ?')) return;
        //if (!checkSubmitData()) return;

        // check 是否已經 field done
        checkFieldDone(checkOK);
        function checkOK(msg) {
            if (!isFieldDone)
                alert((msg == '' ? '' : msg + '\n') + 'Questionnaire is not complete yet.');
            offlineUpdateLocation();
        }
    });
});

$(document).on('pageshow', '#verify', function () {
    var options = { frequency: 500 };  // Update every 3 seconds
    watchAccelerationID = navigator.accelerometer.watchAcceleration(onMotionSuccess, onMotionError, options);
    // 搖晃手機 Save
    function onMotionSuccess(acceleration) {
        if (startTime != '1900-01-01 00:00:00' && startTime != null) {
            if (Math.abs(acceleration.x) > 12 || Math.abs(acceleration.y) > 12 || Math.abs(acceleration.z) > 12) {
                //if (!checkSubmitData()) return;
                shake = true;
                checkFieldDone(checkOK);
            }
        }
        function checkOK(msg) {
            offlineUpdateLocation();
        }
    };
    function onMotionError() {
        alert('MotionError!');
    };

    // navigator.accelerometer.clearWatch(watchAccelerationID);
});

$(document).on('pagebeforehide', '#verify', function (e, data) {
    navigator.accelerometer.clearWatch(watchAccelerationID);
});

$(document).on('pageinit', '#selectAddress', function () {
    //alert('pageinit');
    $(window).resize(function () {
        $('.verify_status').css({ 'height': (($(window).height()) - 219) + 'px' });
    });

    //alert('selectAddress pageinit');
    //alert('getBasicInfo');
});

$(document).on('pageshow', '#selectAddress', function () {
    //alert('pageshow');
    $('.verify_status').css({ 'height': (($(window).height()) - 219) + 'px' });
    $('#selectAddress .toAddressPage').addClass('ui-btn-active').addClass('ui-disabled');
    getBasicInfo(getBasicInfoOK);
    function getBasicInfoOK() {
        $('.surveyor_id').text(agt_id);
        //alert('offlineGetLocationListByStatus');
        if (isSelectAddressPage) {
            offlineGetLocationListByStatus();
        }
        else
            getStateList();
    }
});

$(document).on('pageshow', '#syncLogPage', function () {
    $('#syncLogPage .toSyncLogPage').addClass('ui-btn-active').addClass('ui-disabled');

    sqlitesync_DB.transaction(function (tx) {
        tx.executeSql("Select [clt_id], [objid], [photoTime], [syncTime] From [SyncLog] Order By [syncTime] Desc, [clt_id], [objid], [photoTime];",
                        [], selectSyncLogSuccess, errorSelectSyncLog);

        function errorSelectSyncLog(err) {
            alert('Select SyncLog error.' + 'Error processing SQL: ' + err.code);
            //console.log("Error processing SQL: " + err.code);
        }

        function selectSyncLogSuccess(tx, results) {
            var content = '';
            content += "<table class='synclog_table' cellspacing='1'>\n";
            content += "    <tr>\n";
            content += "        <th width='22%'>Client ID</th>\n";
            content += "        <th width='26%'>Ref No</th>\n";
            content += "        <th width='26%'>Photo Time</th>\n";
            content += "        <th width='26%'>Sync Time</th>\n";
            content += "    </tr>\n";

            // for 迴圈  產生資料
            for (var i = 0; i < results.rows.length; i++) {
                content += "    <tr>\n";
                content += "        <td>" + results.rows.item(i).clt_id + "</td>\n";
                content += "        <td>" + results.rows.item(i).objid + "</td>\n";
                content += "        <td>" + results.rows.item(i).photoTime + "</td>\n";
                content += "        <td>" + results.rows.item(i).syncTime + "</td>\n";
                content += "    </tr>\n";
            }

            content += "</table>";

            $('#LogContent').html(content);
        }
    });
});

var shake = false;  // 是否晃動手機 Save

var LocationPhoto = [], LocationPhotoNote = [], LocationPhotoTime = [];
var LocationPhotoCount = 0, LocationPhotoIndex = 0;
var clt_id = '';
var startTime;
var isFieldDone = false;
var isSelectAddressPage = true;     // 是否自動叫出地址選擇頁面
var watchAccelerationID;            // 監視手機搖晃

// question 切換
function psnChange(val) {
    if (val == "Others") {
        $('#divsurv_psn_others').show();
    } else {
        $('#divsurv_psn_others').hide();
    }
}
function vstChange(val) {
    if (val == "Yes") {
        $('#a4_2a, #q6, #q7_1a').show();
        $('#a4_2b, #a6_2, #q7_1c').hide();
        $("#res_yn").val("Yes").selectmenu('refresh', true);
    } else {
        $('#a4_2a, #q6, #q7_1a, #q7_1b').hide();
        $('#a4_2b, #q7_1c').show();
    }
}
function resChange(val) {
    if (val == "No") {
        $('#a6_2, #res_n_des, #q7_1b').show();
        $('#q7_1a').hide();
    } else {
        $('#a6_2, #resin, #q7_1b').hide();
        $('#q7_1a').show();
    }
}

// 初始化 local DB
function startInitDB(mustInit) {    // 若是 mustInit 為 true，取消 init 則退出 app
    if (!isOnline) {
        alert('Please check your internet connection');
        if (mustInit) navigator.app.exitApp();
    }
    else if (confirm('Are you sure you want to initialize ?')) {
        myDBInit();
    }
    else if (mustInit) {
        navigator.app.exitApp();
    }
}

// 把 Case 依照不同的 Flag 歸類道不同的 listview 中
function offlineGetLocationListByStatus() {
    sqlitesync_DB.transaction(function (tx) {
        tx.executeSql("SELECT [objid], [address_e], [flag] FROM [Location] Where [agt_id]=? Order By [address_e];",
                                  [agt_id], getLocationSuccess, errorGetLocation);
    });

    function errorGetLocation(err) {
        alert('Get location list error.' + 'Error processing SQL: ' + err.code);
        //console.log("Error processing SQL: " + err.code);
    }
    function getLocationSuccess(tx, results) {
        $('#listFlag3').empty();
        $('#listFlag4').empty();
        $('#listFlag5').empty();

        if (results.rows.length == 0) {
            alert('No location list found.\nPlease Goto Data Manager to Sync and set Surveyor ID');
        }
        else {
            if (isSelectAddressPage) {
                $('#listFlag3').append('<li><span class="th_case_id">Case ID</span><span class="th_case_add">Address</span><div class="clear"></div></li>');
                $('#listFlag4').append('<li><span class="th_case_id">Case ID</span><span class="th_case_add">Address</span><div class="clear"></div></li>');
                $('#listFlag5').append('<li><span class="th_case_id">Case ID</span><span class="th_case_add">Address</span><div class="clear"></div></li>');

                var flag3Count = 0, flag4Count = 0, flag5Count = 0;
                
                //alert('results.rows.length: ' + results.rows.length);
                for (i = 0; i < results.rows.length; i++) {
                    $("#address_e").append("<option value='" + results.rows.item(i).objid + "'>" + results.rows.item(i).address_e + "</option>");

                    if (results.rows.item(i).flag == 3) flag3Count++;
                    if (results.rows.item(i).flag == 4) flag4Count++;
                    if (results.rows.item(i).flag == 5) flag5Count++;

                    //$("#listAddress").append("<li><a href='#' onclick=\"selectObjid('" + results.rows.item(i).objid + "', '" + results.rows.item(i).address_e + "');\">" + results.rows.item(i).objid + "<br />" + results.rows.item(i).address_e + "</a></li>").trigger('create');
                    $("#listFlag" + results.rows.item(i).flag).append("<li class='td_case'><a href='#' onclick=\"selectObjid('" + results.rows.item(i).objid + "', '" + results.rows.item(i).address_e + "');\"><span class='td_case_id'>" + results.rows.item(i).objid + "</span><span class='td_case_add'>" + results.rows.item(i).address_e + "</span></a><div class='clear'></div></li>").trigger('create');
                }

                //alert(flag3Count + ',' + flag4Count + ',' + flag5Count);
                $('#flag3Count').text(flag3Count);
                $('#flag4Count').text(flag4Count);
                $('#flag5Count').text(flag5Count);

                //$("#listAddress").listview("refresh");
                //$("#listFlag3").listview("refresh");
                //$("#listFlag4").listview("refresh");
                //$("#listFlag5").listview("refresh");
            }
            else {
                for (i = 0; i < results.rows.length; i++) {
                    $("#address_e").append("<option value='" + results.rows.item(i).objid + "'>" + results.rows.item(i).address_e + "</option>");
                }
            }
        }
    }
}

// 設定 state 的下拉式選單
function getStateList() {
    //console.log('getStateList');
    $("#adl1_name").empty();
    $("#adl1_name").prepend("<option value='0'>Select State</option>");

    //sqlitesync_DB.transaction(function (tx) { tx.executeSql("SELECT adl1_name FROM State Order By adl1_name;", [], getStateSuccess, errorGetState); });
    sqlitesync_DB.transaction(function (tx) {
        tx.executeSql("SELECT [adl1_name] FROM [State] where [adl1_name] in (select distinct [adl1_name] From [Location] where [agt_id]=?) Order By [adl1_name];",
                      [agt_id], getStateSuccess, errorGetState);

        function errorGetState(err) {
            alert('Get state list error.' + 'Error processing SQL: ' + err.code);
            //console.log("Error processing SQL: " + err.code);
        }
        function getStateSuccess(tx, results) {
            if (results.rows.length == 0) {
                //navigator.notification.alert('Table store not exist.', nullAlert, 'Check Table', 'OK');
                alert('No state list found.\nPlease Goto Data Manager to sync');
            }
            else {
                //navigator.notification.alert('Table store exist.', nullAlert, 'Check Table', 'OK');
                //alert('Table ' + checkTable + ' exist.');
                //console.log('results.rows.length : ' + results.rows.length);
                for (i = 0; i < results.rows.length; i++) {
                    $("#adl1_name").append("<option value='" + results.rows.item(i).adl1_name + "'>" + results.rows.item(i).adl1_name + "</option>");
                }

                $("#adl1_name")[0].selectedIndex = 0;
                $("#adl1_name").selectmenu('refresh', true);

                $("#adl5_name").empty();
                $("#adl5_name").prepend("<option value='0'>Select LGA / District</option>");
                $("#adl5_name")[0].selectedIndex = 0;
                $("#adl5_name").selectmenu('refresh', true);
            }
        }
    });
}

// 清除 surver 的資料
function clearLocationData() {
    $("#objid").val('');
    $("#name_e").val('');
    //$("#address_e").val('');
    $("#address_e_1").val('');
    $("#x_lat").val('');
    $("#y_long").val('');

    $("#verify_hidden").hide();
    $('#divstartVerify').show();

    //$('#fieldDone').prop('checked', false).checkboxradio('refresh'); ;

    clearQuestion();

    function clearQuestion() {
        $("#busstop").val('');
        $("#polic").val('');
        $("#landmark").val('');

        // select
        $("#rd_s_asph").val('').selectmenu('refresh', true);
        $("#lu_type").val('').selectmenu('refresh', true);
        $("#surv_psn").val('').selectmenu('refresh', true);

        $("#surv_psn_others").val('');

        // select
        $("#cmt_tgt").val('').selectmenu('refresh', true);
        $("#obj_vst_yn").val('').selectmenu('refresh', true);

        $("#objv_y_des").val('');
        $("#objv_n_des").val('');

        $("#pic_note").val('');
        var image = document.getElementById('smallImage');
        image.src = "data:image/jpeg;base64,";
        $("#photoNav").text('');
        $("#pic_des").val('');

        // select
        $("#res_yn").val('').selectmenu('refresh', true);

        $("#res_n_des").val('');
        $("#cmt_res_y").val('');
        $("#cmt_v_name").val('');
        $("#cmt_nofind").val('');
        $("#note").val('');
    }
}

// 選擇 Case 之後的處理
function selectObjid(objid, address) {
    offlineGetLocationInfo();

    function offlineGetLocationInfo() {
        $.blockUI();
        sqlitesync_DB.transaction(function (tx) {
            tx.executeSql("SELECT [adl1_name], [adl5_name], [clt_id], [name_e], [address_e], [x_lat], [y_long], [busstop], [polic], [landmark], [rd_s_asph], [lu_type], [surv_psn], [surv_psn_others], [cmt_tgt], [obj_vst_yn]," +
                          " [objv_y_des], [objv_n_des], [res_yn], [res_n_des], [cmt_res_y], [cmt_v_name], [cmt_nofind], [note], strftime('%Y-%m-%d %H:%M:%S', [startTime]) as [startTime], [flag] " +
                          "FROM [Location] Where [objid]=? And [address_e]=? Order By [objid];",
                          [objid, address], getLocationInfoSuccess, errorGetLocationInfo);
        });

        function errorGetLocationInfo(err) {
            $.unblockUI();
            alert('Get location info error.' + 'Error processing SQL: ' + err.code);
            //console.log("Error processing SQL: " + err.code);
        }
        function getLocationInfoSuccess(tx, results) {
            if (results.rows.length == 0) {
                $.unblockUI();
                //navigator.notification.alert('Table store not exist.', nullAlert, 'Check Table', 'OK');
                alert('No location info found.\nPlease Goto Data Manager to sync');
            }
            else {
                $.mobile.changePage("#verify", { transition: "slideup", changeHash: true });
                clearLocationData();

                if (isSelectAddressPage) {
                    $("#adl1_name").empty();
                    $("#adl1_name").append("<option value='" + results.rows.item(0).adl1_name + "'>" + results.rows.item(0).adl1_name + "</option>");
                    $("#adl1_name").val(results.rows.item(0).adl1_name).selectmenu('refresh', true);

                    $("#adl5_name").empty();
                    //$("#adl5_name").prepend("<option value='0'>Select LGA / District</option>");
                    $("#adl5_name").append("<option value='" + results.rows.item(0).adl5_name + "'>" + results.rows.item(0).adl5_name + "</option>");
                    $("#adl5_name").val(results.rows.item(0).adl5_name).selectmenu('refresh', true);

                    $("#address_e").val(objid).selectmenu('refresh', true);

                    $("#adl1_name").selectmenu('disable');
                    $("#adl5_name").selectmenu('disable');
                    $("#address_e").selectmenu('disable');
                }

                clt_id = results.rows.item(0).clt_id;
                $("#objid").val(objid);

                $('#address_e_1').val(address);

                $("#name_e").val(results.rows.item(0).name_e);
                //$("#address_e").val(results.rows.item(0).address_e);
                $("#x_lat").val(results.rows.item(0).x_lat);
                $("#y_long").val(results.rows.item(0).y_long);

                startTime = results.rows.item(0).startTime;
                //console.log('startTime : ' + startTime);
                //console.log(startTime == '1900-01-01 00:00:00' || startTime == null);
                //console.log('startTime : ' + startTime);

                $("#busstop").val(results.rows.item(0).busstop);
                $("#polic").val(results.rows.item(0).polic);
                $("#landmark").val(results.rows.item(0).landmark);

                //console.log('rd_s_asph from sqlite : ' + results.rows.item(0).rd_s_asph);

                // select
                $("#rd_s_asph").val(results.rows.item(0).rd_s_asph).selectmenu('refresh', true);
                $("#lu_type").val(results.rows.item(0).lu_type).selectmenu('refresh', true);
                $("#surv_psn").val(results.rows.item(0).surv_psn).selectmenu('refresh', true);
                psnChange(results.rows.item(0).surv_psn);

                $("#surv_psn_others").val(results.rows.item(0).surv_psn_others);

                // select
                $("#cmt_tgt").val(results.rows.item(0).cmt_tgt).selectmenu('refresh', true);
                $("#obj_vst_yn").val(results.rows.item(0).obj_vst_yn).selectmenu('refresh', true);
                vstChange(results.rows.item(0).obj_vst_yn);

                $("#objv_y_des").val(results.rows.item(0).objv_y_des);
                $("#objv_n_des").val(results.rows.item(0).objv_n_des);

                // select
                $("#res_yn").val(results.rows.item(0).res_yn).selectmenu('refresh', true);
                resChange(results.rows.item(0).res_yn);

                $("#res_n_des").val(results.rows.item(0).res_n_des);
                $("#cmt_res_y").val(results.rows.item(0).cmt_res_y);
                $("#cmt_v_name").val(results.rows.item(0).cmt_v_name);
                $("#cmt_nofind").val(results.rows.item(0).cmt_nofind);
                $("#note").val(results.rows.item(0).note);

                // 檢查是否讀取到 GPS
                if ($("#x_lat").val() != '' && $("#y_long").val() != '') {
                    //if (startTime == '1900-01-01 00:00:00' || startTime == null) startTime = dateTimeToStr(new Date());
                    if (startTime == '1900-01-01 00:00:00' || startTime == null) startTime = dateTimeToUTCStr(new Date());
                    $("#verify_hidden").show();
                    $('#divstartVerify').hide();
                }

                getLocationPhoto(0);
            }
        }
    }

    function onlineGetLocationinfo() {
        $.blockUI();
        Url = UrlBase + ServiceName + "/GetLocationInfo";
        Data = '{"agt_id" : "' + agt_id + '", ' +
                        '"adl1_name": "' + $("#adl1_name").val() + '", ' +
                        '"adl5_name": "' + $("#adl5_name").val() + '", ' +
                        '"objid" : "' + $("#objid").val() + '"}';
        ContentType = "application/json; charset=utf-8";
        DataType = "json";
        //ProcessData = true;

        $.support.cors = true;

        $.ajax({
            type: Type, //GET or POST or PUT or DELETE verb
            url: Url, // Location of the service
            data: Data, //Data sent to server
            contentType: ContentType, // content type sent to server
            dataType: DataType, //Expected data format from server
            //processdata: ProcessData, //True or False
            timeout: ajaxTimeout,
            success: function (msg) {//On Successfull service call
                $.unblockUI();

                var LocationInfo = JSON.parse(msg.GetLocationInfoResult);
                if (LocationInfo.msg == "OK") {
                    //alert('OK\n' + LocationListInfo.LocationList.length);
                    clt_id = LocationInfo.LocationInfo.clt_id;
                    $("#name_e").val(LocationInfo.LocationInfo.name_e);
                    $("#address_e").val(LocationInfo.LocationInfo.address_e);
                    $("#x_lat").val(LocationInfo.LocationInfo.x_lat);
                    $("#y_long").val(LocationInfo.LocationInfo.y_long);

                    // 檢查是否讀取到 GPS
                    if ($("#x_lat").val() != '' && $("#y_long").val() != '') {
                        $("#verify_hidden").show();
                        $('#divstartVerify').hide();
                    }

                    $("#busstop").val(LocationInfo.LocationInfo.busstop);
                    $("#polic").val(LocationInfo.LocationInfo.polic);
                    $("#landmark").val(LocationInfo.LocationInfo.landmark);

                    // select
                    $("#rd_s_asph").val(LocationInfo.LocationInfo.rd_s_asph);
                    $("#lu_type").val(LocationInfo.LocationInfo.lu_type);
                    $("#surv_psn").val(LocationInfo.LocationInfo.surv_psn);

                    $("#surv_psn_others").val(LocationInfo.LocationInfo.surv_psn_others);

                    // select
                    $("#cmt_tgt").val(LocationInfo.LocationInfo.cmt_tgt);
                    $("#obj_vst_yn").val(LocationInfo.LocationInfo.lu_type);

                    $("#objv_y_des").val(LocationInfo.LocationInfo.objv_y_des);
                    $("#objv_n_des").val(LocationInfo.LocationInfo.objv_n_des);

                    // select
                    $("#res_yn").val(LocationInfo.LocationInfo.res_yn);

                    $("#res_n_des").val(LocationInfo.LocationInfo.res_n_des);
                    $("#cmt_res_y").val(LocationInfo.LocationInfo.cmt_res_y);
                    $("#cmt_v_name").val(LocationInfo.LocationInfo.cmt_v_name);
                    $("#cmt_nofind").val(LocationInfo.LocationInfo.cmt_nofind);
                    $("#note").val(LocationInfo.LocationInfo.note);
                }
                else
                    alert(LocationInfo.msg);
            },
            error: AjaxError
        });
    }
}

// 讀取並顯示照片
function getLocationPhoto(pIndex) {
    $.unblockUI();
    $.blockUI({ message: '<h1>Get location photo</h1>' });
    //console.log('getLocationPhoto : ' + pIndex);
    sqlitesync_DB.transaction(function (tx) {
        tx.executeSql("Select [photoData], [notes], [photoTime] From photo Where [clt_id]=? and [objid]=? Order By [photoTime];",
                          [clt_id, $("#objid").val()], getLocationPhotoSuccess, errorGetLocationPhoto);
    });

    function errorGetLocationPhoto(err) {
        $.unblockUI();
        alert('Get location photo error.' + 'Error processing SQL: ' + err.code);
        //console.log("Error processing SQL: " + err.code);
    }
    function getLocationPhotoSuccess(tx, results) {
        LocationPhoto = [];
        LocationPhotoNote = [];
        LocationPhotoTime = [];

        LocationPhotoCount = results.rows.length;
        LocationPhotoIndex = pIndex;

        if (LocationPhotoCount == 0) {
            //navigator.notification.alert('Table store not exist.', nullAlert, 'Check Table', 'OK');
            //alert('No location photo found.');
        }
        else {
            //console.log('LocationPhotoCount : ' + LocationPhotoCount);
            for (i = 0; i < LocationPhotoCount; i++) {
                LocationPhoto[i] = results.rows.item(i).photoData;
                LocationPhotoNote[i] = results.rows.item(i).notes;
                LocationPhotoTime[i] = results.rows.item(i).photoTime;
            }
        }

        checkPhotoNav();
    }
}
// 顯示照片  並設定照片相關按鈕
function checkPhotoNav() {
    var image = document.getElementById('smallImage');
    if (LocationPhotoCount == 0) {
        $("#photoNav").text('');
        image.src = "data:image/jpeg;base64,";
        $("#pic_des").val('');

        $("#divPrev").hide();
        $("#divNext").hide();
        $("#divDelete").hide();
    }
    else {
        if (LocationPhotoIndex >= LocationPhotoCount) LocationPhotoIndex = LocationPhotoCount - 1;
        $("#photoNav").text((LocationPhotoIndex + 1) + '/' + LocationPhotoCount);
        //console.log('LocationPhotoIndex : ' + LocationPhotoIndex);
        //console.log('LocationPhoto : ' + LocationPhoto[LocationPhotoIndex]);
        image.src = "data:image/jpeg;base64," + LocationPhoto[LocationPhotoIndex];
        $("#pic_des").val(LocationPhotoNote[LocationPhotoIndex]);

        if (LocationPhotoIndex == 0) {
            $("#divPrev").hide();
        }
        else {
            $("#divPrev").show();
        }

        if (LocationPhotoIndex == LocationPhotoCount - 1) {
            $("#divNext").hide();
        }
        else {
            $("#divNext").show();
        }

        $("#divDelete").show();
    }

    $.unblockUI();
}

function checkSubmitData() {
    // 先檢查資料是否輸入完整
    var errmsg = "";

    if ($("#rd_s_asph").val() == '')
        errmsg += 'Is the road tarred ?\n';

    if ($("#lu_type").val() == '')
        errmsg += 'Description of the area ?\n';

    if ($("#surv_psn").val() == '')
        errmsg += 'Person met at location ?\n';

    if ($("#cmt_tgt").val() == '')
        errmsg += 'Comment from Person met ?\n';

    if ($("#obj_vst_yn").val() == '')
        errmsg += 'Address located and visited ?\n';

    if ($('#obj_vst_yn').val() == 'Yes' && $("#res_yn").val() == '')
        errmsg += 'Does customer resides at the address ?\n';

    if (errmsg.length > 0) {
        errmsg = errmsg.substring(0, errmsg.length - 1);
        alert(errmsg);
        return false;
    }

    return true;
}

// 檢查是否已完成 Case
function checkFieldDone(checkOK) {
    // 先檢查照片是否已拍
    // 檢查           table [photo]   field [clt_id] + [objid]
    // 若沒有，再檢查 table [SyncLog] field [clt_id] + [objid]
    sqlitesync_DB.transaction(function (tx) {
        tx.executeSql('Select Count(*) As photoCount From [photo] Where [clt_id]=? and [objid]=?',
                      [clt_id, $("#objid").val()], checkPhotoSuccess, errorCheckPhoto);
    });
    function checkPhotoSuccess(tx, results) {
        //alert('checkPhotoSuccess ' + results.rows.length);
        if (results.rows.length == 1) {
            if (results.rows.item(0).photoCount == 0) {
                checkSyncPhoto();
            }
            else {
                checkFieldData();
            }
        }
        else
            alert('Check location photo error!!');
    }
    function errorCheckPhoto(err) {
        alert('Check location photo error.' + 'Error processing SQL: ' + err.code);
    }

    function checkSyncPhoto()
    {
        sqlitesync_DB.transaction(function (tx) {
            tx.executeSql('Select Count(*) As photoCount From [SyncLog] Where [clt_id]=? and [objid]=? and [photoTime] <> ""',
                      [clt_id, $("#objid").val()], checkSyncPhotoSuccess, errorCheckSyncPhoto);
        });
        function checkSyncPhotoSuccess(tx, results) {
            //alert('checkSyncPhotoSuccess ' + results.rows.length + ',' + results.rows.item(0).photoCount);
            if (results.rows.length == 1) {
                if (results.rows.item(0).photoCount == 0) {
                    isFieldDone = false;
                    if (checkOK) checkOK('No photos for this case!!');
                }
                else {
                    checkFieldData();
                }
            }
            else
                alert('Check sync photo error!!');
        }
        function errorCheckSyncPhoto(err) {
            alert('Check sync photo error.' + 'Error processing SQL: ' + err.code);
        }
    }

    function checkFieldData() {
        // check 是否已經 field done
        isFieldDone = !(($('#busstop').val() == '') ||
            ($('#landmark').val() == '') ||
            ($('#rd_s_asph').val() == '') ||
            ($('#lu_type').val() == '') ||
            ($('#surv_psn').val() == '') ||
            ($("#surv_psn").val() == 'Others' && $("#surv_psn_others").val() == '') ||
            ($("#cmt_tgt").val() == '') ||
            ($("#obj_vst_yn").val() == '') ||
            ($("#obj_vst_yn").val() == 'Yes' && $("#objv_y_des").val() == '') ||
            ($("#obj_vst_yn").val() == 'No' && $("#objv_n_des").val() == '') ||
            ($("#obj_vst_yn").val() == 'Yes' && $("#res_yn").val() == '') ||
            ($("#obj_vst_yn").val() == 'Yes' && $("#res_yn").val() == 'No' && $("#res_n_des").val() == ''));
        if (checkOK) checkOK('');
    }
}
// 離線寫入 local DB
function offlineUpdateLocation() {
    sqlitesync_DB.transaction(function (tx) {
        tx.executeSql('Update Location Set [x_lat]=?, [y_long]=?, [busstop]=?, [polic]=?, [landmark]=?, [rd_s_asph]=?, [lu_type]=?, [surv_psn]=?, [surv_psn_others]=?, [cmt_tgt]=?, [obj_vst_yn]=?, ' +
                                  '[objv_y_des]=?, [objv_n_des]=?, [res_yn]=?, [res_n_des]=?, [cmt_res_y]=?, [cmt_v_name]=?, [cmt_nofind]=?, [note]=?, [startTime]=?, [modifyTime]=?, [flag]=? Where [clt_id]=? and [objid]=?',
                                  [$("#x_lat").val(),
                                   $("#y_long").val(),
                                   $("#busstop").val(),
                                   $("#polic").val(),
                                   $("#landmark").val(),
                                   $("#rd_s_asph").val(),   //$("#rd_s_asph").find(":selected").val() == null ? $("#rd_s_asph").get(0).val() : $("#rd_s_asph").find(":selected").val(),
                                   $("#lu_type").val(),     //$("#lu_type").find(":selected").val() == null ? $("#lu_type").get(0).val() : $("#lu_type").find(":selected").val(),
                                   $("#surv_psn").val(),    //$("#surv_psn").find(":selected").val() == null ? $("#surv_psn").get(0).val() : $("#surv_psn").find(":selected").val(),
                                   $("#surv_psn_others").val(),
                                   $("#cmt_tgt").val(),     //$("#cmt_tgt").find(":selected").val() == null ? $("#cmt_tgt").get(0).val() : $("#cmt_tgt").find(":selected").val(),
                                   $("#obj_vst_yn").val(),  //$("#obj_vst_yn").find(":selected").val() == null ? $("#obj_vst_yn").get(0).val() : $("#obj_vst_yn").find(":selected").val(),
                                   $("#objv_y_des").val(),
                                   $("#objv_n_des").val(),
                                   $("#res_yn").val(),      //$("#res_yn").find(":selected").val() == null ? $("#res_yn").get(0).val() : $("#res_yn").find(":selected").val(),
                                   $("#res_n_des").val(),
                                   $("#cmt_res_y").val(),
                                   $("#cmt_v_name").val(),
                                   $("#cmt_nofind").val(),
                                   $("#note").val(),
                                   startTime,
                                   dateTimeToUTCStr(new Date()),
                                   isFieldDone ? '5' : '4',
                                   clt_id,
                                   $("#objid").val()],
                                  submitLocationSuccess, errorSubmitLocation);
    });
    function errorSubmitLocation(err) {
        alert('Save location error.' + 'Error processing SQL: ' + err.code);
        //console.log("Error processing SQL: " + err.code);

        shake = false;
    }
    function submitLocationSuccess(tx, results) {
        if (shake) {
            navigator.notification.beep(1);
            navigator.notification.vibrate(1000);
        }
        else
            alert('Location Saved');

        offlineGetLocationListByStatus();
        shake = false;

        // 檢查是否有 Internet
        //if (checkInternet()) {
        if (isOnline) {
            //alert('online')
            // 檢查是否有必須 Sync 的資料
            //checkMustSync(MustSync);
            //MustSync();
            $('.doSync').removeClass('ui-disabled');
            doSync();
        }
        else {
            //alert('offline');
        }
    }

    // 若有必須 Sync 的資料 則 Sunc
    //function MustSync() {
        //alert('MustSync');
    //    $('.doSync').removeClass('ui-disabled');
    //    doSync();
    //}
}
// 和主機 Sync
function doSync() {
    myDBSync(myDBSyncOK);
    function myDBSyncOK() {
        //$('.doSync').addClass('ui-disabled');
        offlineGetLocationListByStatus();
    }
}

function onlineUpdateLocation() {
    //
    //                $.blockUI();
    //                Url = UrlBase + ServiceName + "/UpdateShop";
    //                Data = '{"StoreID": "' + $("#shopname").val() +
    //								'", "Address": "' + $("#address").val() +
    //								'", "longitude": "' + $("#longitude").val() +
    //								'", "latitude": "' + $("#latitude").val() +
    //								'", "tel": "' + $("#tel").val() +
    //								'", "shoptime": "' + $("#shoptime").val() + '"}';
    //                ContentType = "application/json; charset=utf-8";
    //                DataType = "json";

    //                $.support.cors = true;

    //                $.ajax({
    //                    type: Type, //GET or POST or PUT or DELETE verb
    //                    url: Url, // Location of the service
    //                    data: Data, //Data sent to server
    //                    contentType: ContentType, // content type sent to server
    //                    dataType: DataType, //Expected data format from server
    //                    success: function (msg) {//On Successfull service call
    //                        $.unblockUI();
    //                        var UpdateShopInfo = JSON.parse(msg.UpdateShopResult);
    //                        alert(UpdateShopInfo.result);
    //                    },
    //                    error: function (a, e, d) {
    //                        $.unblockUI();
    //                        alert(e + ' ' + d);
    //                    } // When Service call fails
    //                });
}