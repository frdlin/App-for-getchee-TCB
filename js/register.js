var isOnline;
// 等待加載PhoneGap  
document.addEventListener("deviceready", onDeviceReady, false);
// PhoneGap加載完畢  
function onDeviceReady() {
    sqlitesync_DB = createDBConnection();
    $('#sync').addClass('ui-disabled');
    isOnline = checkInternet();

    checkOfflineDB(offlineDBOK, offlineDBFalse);
    function offlineDBOK() {
        //console.log('checkOfflineOK');
        getAgt_Id(getAgt_IdOK);
        function getAgt_IdOK() {
            $('#spanAgt_id').text(agt_id);
            getStateList();
        }

        if (isOnline)
            checkMustSync(mustSync);
        function mustSync() {
            $('#sync').removeClass('ui-disabled');
        }
    }
    function offlineDBFalse() {
        if (!isOnline) {
            alert('Please check your internet connection');
            navigator.app.exitApp();
        }
        else
        // 要執行 initialize
            startManager();
    }

    document.addEventListener("online", onOnline, false);
    document.addEventListener("offline", onOffline, false);
    function onOnline() {
        isOnline = true;
        checkOfflineDB(offlineDBOK, offlineDBFalse);
        function offlineDBOK() {
            $('#sync').removeClass('ui-disabled');
            //checkMustSync(mustSync);
            //function mustSync() {
            //    $('#sync').removeClass('ui-disabled');
            //}
        }
    }
    function onOffline() {
        isOnline = false;
        $('#sync').addClass('ui-disabled');
    }

    document.addEventListener("backbutton", myBack, false);
    function myBack(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to exit ?')) navigator.app.exitApp();
    }
}

$(document).on('pageinit', '#register', function () {
    $("#adl1_name").change(
		function () {
		    $("#adl5_name").empty();
		    $("#adl5_name").prepend("<option value='0'>Select LGA / District</option>");
		    $("#adl5_name")[0].selectedIndex = 0;
		    $("#adl5_name").selectmenu('refresh', true);

		    //$("#objid").empty();
		    //$("#objid").prepend("<option value='0'>Select Reference Number</option>");
		    //$("#objid")[0].selectedIndex = 0;
		    //$("#objid").selectmenu('refresh', true);

		    //ClearLocationData();

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
		            tx.executeSql("SELECT adl5_name FROM District Where adl1_name=? Order By adl5_name;",
                                  [$("#adl1_name").val()], getDistrictSuccess, errorGetDistrict);
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

    $("#submit").click(
		function () {
		    if (!confirm('Confirm registration ?')) return;
		    if (!checkRegisterData()) return;

		    offlineRegisterShop();

		    function checkRegisterData() {
		        // 先檢查資料是否輸入完整
		        var errmsg = "";
		        if ($("#adl5_name").val() == "0")
		            errmsg += 'Select LGA / District\n';

		        if ($("#clt_id").val().length == 0)
		            errmsg += 'Input Client\'s ID\n';

		        if ($("#objid").val().length == 0)
		            errmsg += 'Input Reference Number\n';

		        if ($("#name_e").val().length == 0)
		            errmsg += 'Input Customer Name\n';

		        if ($("#address_e").val().length == 0)
		            errmsg += 'Input Address\n';

		        if (errmsg.length > 0) {
		            errmsg = errmsg.substring(0, errmsg.length - 1);
		            alert(errmsg);
		            return false;
		        }

		        return true;
		    }

		    function offlineRegisterShop() {
		        addLocalStore();
		    }

		    function addLocalStore() {
		        sqlitesync_DB.transaction(function (tx) {
		            //alert('before insert');
		            console.log($("#clt_id").val() + ',' +
                                $("#objid").val() + ',' +
                                $("#adl1_name").val() + ',' +
                                $("#adl5_name").val() + ',' +
                                agt_id + ',' +
                                $("#name_e").val() + ',' +
                                $("#address_e").val());
		            tx.executeSql('INSERT INTO Location ([clt_id], [objid], [adl1_name], [adl5_name], [adl2_name], [agt_id], [name_e], [address_e], [createTime], [flag]) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
                                  [$("#clt_id").val(),
                                   $("#objid").val(),
                                   $("#adl1_name").val(),
                                   $("#adl5_name").val(),
                                   '',
                                   agt_id,
                                   $("#name_e").val(),
                                   $("#address_e").val(),
                                   dateTimeToUTCStr(new Date()),
                                   '3'],
                                  registerLocationSuccess, errorRegisterLocation);
		            //alert('after insert');
		        });
		        function errorRegisterLocation(err) {
		            alert('Register local location error.' + 'Error processing SQL: ' + err.code);
		            //console.log("Error processing SQL: " + err.code);
		        }
		        function registerLocationSuccess(tx, results) {
		            alert('Register local location successful');
		        }
		    }
		});

    $(document).on("vclick", "#sync", function (e) {
        myDBSync(myDBSyncOK);
        function myDBSyncOK() {
            //$('#sync').addClass('ui-disabled');
        }
    });
});

function getStateList() {
    //console.log('getStateList');
    $("#adl1_name").empty();
    $("#adl1_name").prepend("<option value='0'>Select State</option>");

    sqlitesync_DB.transaction(function (tx) { tx.executeSql("SELECT adl1_name FROM State Order By adl1_name;", [], getStateSuccess, errorGetState); });

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
}
