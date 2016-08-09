function getBasicInfo(getBasicInfoOK) {
    //console.log("getBasicInfo");

    // 取得 lastUpdateTime
    sqlitesync_DB.transaction(function (tx) {
        //alert('transaction');
        tx.executeSql("Select [agt_id], strftime('%Y-%m-%d %H:%M:%S', [lastUpdateTime]) as [lastUpdateTime] From [BasicInfo];",
                      [], getBasicInfoSuccess, errorGetBasicInfo);

        function errorGetBasicInfo(err) {
            alert('Get BasicInfo error.' + 'Error processing SQL: ' + err.code);
            //console.log("Error processing SQL: " + err.code);
            //navigator.notification.alert('Check Table error.', checkInternet, 'checkTable', 'OK');
        }
        function getBasicInfoSuccess(tx, results) {
            //alert('getBasicInfoSuccess');
            if (results.rows.length == 0) {
                tx.executeSql("Insert Into [BasicInfo] ([agt_id], [lastUpdateTime]) Values(?, ?);",
                              [agt_id, lastUpdateTime], insertBasicInfoSuccess, errorInsertBasicInfo);
                //navigator.notification.alert('Table store not exist.', nullAlert, 'Check Table', 'OK');
            }
            else {
                //console.log("Select BasicInfo success");
                agt_id = results.rows.item(0).agt_id;
                lastUpdateTime = results.rows.item(0).lastUpdateTime == null ? '' : results.rows.item(0).lastUpdateTime;

                if (getBasicInfoOK) getBasicInfoOK();
                //getBasicInfoOK();
            }

            // 新增一筆資料到 BasicInfo
            function insertBasicInfoSuccess(tx, results) {
                //alert('insertBasicInfoSuccess');
                if (getBasicInfoOK) getBasicInfoOK();
                //getBasicInfoOK();
            }
            function errorInsertBasicInfo(err) {
                alert('Insert BasicInfo error.' + 'Error processing SQL: ' + err.code);
                //console.log("Error processing SQL: " + err.code);
            }
        }
    });
}

// 檢查是否有資料還沒 Sync 回去
function checkMustSync(mustSync) {
    //alert('checkMustSync');
    sqlitesync_DB.transaction(function (tx) {
        tx.executeSql("Select [agt_id] From [Location]"
                          + " Where [agt_id]=? and [modifyTime]>=?;"
                          , [agt_id, lastUpdateTime], checkLocationSyncSuccess, errorCheckLocationSync);

        function errorCheckLocationSync(err) {
            alert('Check location for sync error.' + 'Error processing SQL: ' + err.code);
        }
        function checkLocationSyncSuccess(tx, results) {
            //alert('checkLocationSyncSuccess Count : ' + results.rows.length);
            if (results.rows.length == 0) {
                // Location 沒有需要回傳的資料
                // 檢查 photo 是否有照片未回傳
                tx.executeSql("Select [photoTime] From [photo] Where [photoTime]>=?;",
                                  [lastUpdateTime], checkPhotoSyncSuccess, errorCheckPhotoSync);
            }
            else {
                // Location 有需要回傳的資料

                //alert('mustSync 1');
                if (mustSync) mustSync();
                //MustSync();
            }
        }

        function errorCheckPhotoSync(err) {
            alert('Check photo for sync error.' + 'Error processing SQL: ' + err.code);
        }
        function checkPhotoSyncSuccess(tx, results) {
            //alert('checkPhotoSyncSuccess Count : ' + results.rows.length);
            if (results.rows.length == 0) {
            }
            else {
                // photo 有需要回傳的資料

                //alert('mustSync 2');
                if (mustSync) mustSync();
                //MustSync();
            }
        }
    });
}

function myDBInit() {
    $.blockUI({ message: '<h1>Initializing</h1>' });
    //console.log('myDBInit');
    // 建立基本資料庫 BasicInfo 包含欄位 subScriberId int, lastUpdateTime datetime
    // 建立資料庫所有 Table BasicInfo / Cities / District / photo / Locations / LocationAudits
    sqlitesync_DB.transaction(function (tx) {
        dropLocation();

        function dropLocation() {
            $.unblockUI();
            $.blockUI({ message: '<h1>Initializing 1/7</h1>' });
            //alert('dropLocation');
            tx.executeSql('DROP TABLE IF EXISTS [SyncLog]');
            tx.executeSql('DROP TABLE IF EXISTS [Location]', [], dropLocationSuccess, errorDropLocation);

            function errorDropLocation(err) {
                alert('Drop location error.' + 'Error processing SQL: ' + err.code);
                //console.log("Error processing SQL: " + err.code);
            }
            function dropLocationSuccess(tx, results) {
                createTable();
            }
        }

        function createTable() {
            $.unblockUI();
            $.blockUI({ message: '<h1>Initializing 2/7</h1>' });

            sqlitesync_DB.transaction(function (tx) {
                tx.executeSql('CREATE TABLE IF NOT EXISTS [SyncLog] ([clt_id] [nvarchar](50) NOT NULL, ' +
                                                                       '[objid] [nvarchar](50) NOT NULL, ' +
                                                                       '[adl1_name] [nvarchar](50), ' +
                                                                       '[adl5_name] [nvarchar](50), ' +
                                                                       '[adl2_name] [nvarchar](50), ' +
                                                                       '[agt_id] [nvarchar](50), ' +
                                                                       '[name_e] [nvarchar](50), ' +
                                                                       '[address_e] [nvarchar](100), ' +
                                                                       '[notes] [nvarchar](100), ' +
                                                                       //'[photoTime] [datetime], ' +
                                                                       '[photoTime] [nvarchar](100), ' +
                                                                       '[syncTime] [datetime] NOT NULL);');

                tx.executeSql('CREATE TABLE IF NOT EXISTS [Agent] ([Name] [nvarchar](100) NOT NULL, [Password] [nvarchar](50) NOT NULL, PRIMARY KEY ([Name]));');
                tx.executeSql('CREATE TABLE IF NOT EXISTS [BasicInfo] ([agt_id] [nvarchar](50), [lastUpdateTime] [datetime]);');
                tx.executeSql('CREATE TABLE IF NOT EXISTS [City] ([adl5_name] [nvarchar](50) NOT NULL, [adl2_name] [nvarchar](50) NOT NULL, PRIMARY KEY ([adl5_name], [adl2_name]));');
                tx.executeSql('CREATE TABLE IF NOT EXISTS [District] ([adl1_name] [nvarchar](50) NOT NULL, [adl5_name] [nvarchar](50) NOT NULL, PRIMARY KEY ([adl1_name], [adl5_name]));');

                tx.executeSql('CREATE TABLE IF NOT EXISTS [Location] ([clt_id] [nvarchar](50) NOT NULL, ' +
                                                                       '[objid] [nvarchar](50) NOT NULL, ' +
                                                                       '[adl1_name] [nvarchar](50) NOT NULL, ' +
                                                                       '[adl5_name] [nvarchar](50) NOT NULL, ' +
                                                                       '[adl2_name] [nvarchar](50) NOT NULL, ' +
                                                                       '[agt_id] [nvarchar](50) NOT NULL, ' +
                                                                       '[name_e] [nvarchar](50) NOT NULL, ' +
                                                                       '[address_e] [nvarchar](100), ' +
                                                                       '[x_lat] [nvarchar](50), ' +
                                                                       '[y_long] [nvarchar](50), ' +
                                                                       '[busstop] [nvarchar](50), ' +
                                                                       '[polic] [nvarchar](50), ' +
                                                                       '[landmark] [nvarchar](50), ' +
                                                                       '[rd_s_asph] [nvarchar](50), ' +
                                                                       '[lu_type] [nvarchar](50), ' +
                                                                       '[surv_psn] [nvarchar](50), ' +
                                                                       '[surv_psn_others] [nvarchar](100), ' +
                                                                       '[cmt_tgt] [nvarchar](50), ' +
                                                                       '[obj_vst_yn] [nvarchar](50), ' +
                                                                       '[objv_y_des] [nvarchar](50), ' +
                                                                       '[objv_n_des] [nvarchar](50), ' +
                                                                       '[res_yn] [nvarchar](50), ' +
                                                                       '[res_n_des] [nvarchar](50), ' +
                                                                       '[cmt_res_y] [nvarchar](50), ' +
                                                                       '[cmt_v_name] [nvarchar](50), ' +
                                                                       '[cmt_nofind] [nvarchar](50), ' +
                                                                       '[note] [nvarchar](50), ' +
                                                                       '[createTime] [datetime], ' +
                                                                       '[startTime] [datetime], ' +
                                                                       '[modifyTime] [datetime], ' +
                                                                       '[expirationTime] [datetime], ' +
                                                                       '[flag] [char](1), PRIMARY KEY ([clt_id], [objid]));');

                tx.executeSql('CREATE TABLE IF NOT EXISTS [photo] ([clt_id] [nvarchar](50) NOT NULL, ' +
                                                                    '[objid] [nvarchar](50) NOT NULL, ' +
                                                                    '[photoData] [varchar](10000000) NOT NULL, ' +
                                                                    '[name_e] [nvarchar](50) NOT NULL, ' +
                                                                    '[notes] [nvarchar](100), ' +
                                                                    '[x_lat] [nvarchar](50), ' +
                                                                    '[y_long] [nvarchar](50), ' +
                                                                    '[photoTime] [datetime] NOT NULL, PRIMARY KEY ([clt_id], [objid], [photoTime]));');
                tx.executeSql('CREATE TABLE IF NOT EXISTS [State] ([adl1_name] [nvarchar](50) NOT NULL, PRIMARY KEY ([adl1_name]));');

                //getBasicInfo();
                getTableState();
            });
        }

        function getTableState() {
            $.unblockUI();
            $.blockUI({ message: '<h1>Initializing 3/7</h1>' });
            //console.log('getTableState');
            //syncLog('Sync state');
            Url = UrlBase + ServiceName + "/GetStateList";
            Data = '';  // 須加上 lastUpdate 時間判斷，只取回更新的資料
            ContentType = "application/json; charset=utf-8";
            DataType = "json";

            $.support.cors = true;

            $.ajax({
                type: Type, //GET or POST or PUT or DELETE verb
                url: Url, // Location of the service
                data: Data, //Data sent to server
                contentType: ContentType, // content type sent to server
                dataType: DataType, //Expected data format from server
                timeout: ajaxTimeout,
                success: function (msg) {//On Successfull service call
                    var iInsert = 0, iUpdate = 0;
                    var StateListInfo = JSON.parse(msg.GetStateListResult);
                    if (StateListInfo.msg == "OK") {
                        sqlitesync_DB.transaction(function (tx) {
                            tx.executeSql("Delete From State;", [], deleteStateSuccess, errorDeleteState);
                        });
                    }
                    else {
                        $.unblockUI();
                        alert(StateListInfo.msg);
                    }

                    function deleteStateSuccess(tx, results) {
                        if (StateListInfo.StateList.length == 0) {
                            //console.log("No state.");
                            //syncLog('    No state.');
                            nextStep();
                        }
                        else {
                            for (var i = 0; i < StateListInfo.StateList.length; i++) {
                                //$("#shopname").append("<option value='" + ShopListInfo.ShopList[i].StoreID + "'>" + ShopListInfo.ShopList[i].Store + "</option>");
                                //console.log("'" + ShopListInfo.ShopList[i].StoreID + "', '" + ShopListInfo.ShopList[i].CityID + "', '" + ShopListInfo.ShopList[i].TownID + "', '" + ShopListInfo.ShopList[i].Store + "', '" + ShopListInfo.ShopList[i].inventoryqty + "', '" + ShopListInfo.ShopList[i].CreateTime + "', '" + ShopListInfo.ShopList[i].ModifyTime + "'");
                                updateState(StateListInfo.StateList[i]);
                            }
                        }
                    }

                    function errorDeleteState(err) {
                        alert('Delete state list error.' + 'Error processing SQL: ' + err.code);
                        //console.log("Error processing SQL: " + err.code);
                    }

                    function updateState(StateInfo) {
                        sqlitesync_DB.transaction(function (tx) {
                            iInsert++;
                            tx.executeSql('INSERT INTO State (adl1_name) VALUES (?)',
                                      [StateInfo.adl1_name]);

                            //console.log('Insert state : ' + iInsert + '\nUpdate state : ' + iUpdate);
                            if (iInsert + iUpdate == StateListInfo.StateList.length) {
                                //console.log('Insert state : ' + iInsert + ', Update state : ' + iUpdate);
                                //syncLog('    Insert state : ' + iInsert + ', Update state : ' + iUpdate);
                                nextStep();
                            }
                        });
                    }

                    function nextStep() {
                        getTableDistrict();
                    }
                },
                error: AjaxError
            });
        }

        function getTableDistrict() {
            $.unblockUI();
            $.blockUI({ message: '<h1>Initializing 4/7</h1>' });
            //console.log('getTableDistrict');
            //syncLog('Sync district');
            Url = UrlBase + ServiceName + "/GetDistrictList";
            Data = '{"adl1_name": ""}';    // 須加上 lastUpdate 時間判斷，只取回更新的資料
            ContentType = "application/json; charset=utf-8";
            DataType = "json";

            $.support.cors = true;

            $.ajax({
                type: Type, //GET or POST or PUT or DELETE verb
                url: Url, // Location of the service
                data: Data, //Data sent to server
                contentType: ContentType, // content type sent to server
                dataType: DataType, //Expected data format from server
                timeout: ajaxTimeout,
                success: function (msg) {//On Successfull service call
                    var iInsert = 0, iUpdate = 0;
                    var DistrictListInfo = JSON.parse(msg.GetDistrictListResult);
                    if (DistrictListInfo.msg == "OK") {
                        sqlitesync_DB.transaction(function (tx) {
                            tx.executeSql("Delete From District;");
                        });

                        if (DistrictListInfo.DistrictList.length == 0) {
                            //console.log("No district.");
                            //syncLog('    No district.');
                            nextStep();
                        }
                        else {
                            for (var i = 0; i < DistrictListInfo.DistrictList.length; i++) {
                                //$("#shopname").append("<option value='" + ShopListInfo.ShopList[i].StoreID + "'>" + ShopListInfo.ShopList[i].Store + "</option>");
                                //console.log("'" + ShopListInfo.ShopList[i].StoreID + "', '" + ShopListInfo.ShopList[i].CityID + "', '" + ShopListInfo.ShopList[i].TownID + "', '" + ShopListInfo.ShopList[i].Store + "', '" + ShopListInfo.ShopList[i].inventoryqty + "', '" + ShopListInfo.ShopList[i].CreateTime + "', '" + ShopListInfo.ShopList[i].ModifyTime + "'");
                                updateDistrict(DistrictListInfo.DistrictList[i]);
                            }
                        }
                    }
                    else {
                        $.unblockUI();
                        alert(DistrictListInfo.msg);
                    }

                    function updateDistrict(DistrictInfo) {
                        sqlitesync_DB.transaction(function (tx) {
                            iInsert++;
                            tx.executeSql('INSERT INTO District (adl1_name, adl5_name) VALUES (?, ?)',
                                      [DistrictInfo.adl1_name,
                                       DistrictInfo.adl5_name]);

                            //console.log('Insert district : ' + iInsert + '\nUpdate district : ' + iUpdate);
                            if (iInsert + iUpdate == DistrictListInfo.DistrictList.length) {
                                //console.log('Insert district : ' + iInsert + ', Update district : ' + iUpdate);
                                //syncLog('    Insert district : ' + iInsert + ', Update district : ' + iUpdate);
                                nextStep();
                            }
                        });
                    }

                    function nextStep() {
                        getTableCity();
                    }
                },
                error: AjaxError
            });
        }

        function getTableCity() {
            $.unblockUI();
            $.blockUI({ message: '<h1>Initializing 5/7</h1>' });
            Url = UrlBase + ServiceName + "/GetCityList";
            Data = '{"adl5_name": ""}';  // 須加上 lastUpdate 時間判斷，只取回更新的資料
            ContentType = "application/json; charset=utf-8";
            DataType = "json";

            $.support.cors = true;

            $.ajax({
                type: Type, //GET or POST or PUT or DELETE verb
                url: Url, // Location of the service
                data: Data, //Data sent to server
                contentType: ContentType, // content type sent to server
                dataType: DataType, //Expected data format from server
                timeout: ajaxTimeout,
                success: function (msg) {//On Successfull service call
                    var iInsert = 0, iUpdate = 0;
                    var CityListInfo = JSON.parse(msg.GetCityListResult);
                    if (CityListInfo.msg == "OK") {
                        sqlitesync_DB.transaction(function (tx) {
                            tx.executeSql("Delete From City;");
                        });

                        if (CityListInfo.CityList.length == 0) {
                            //console.log("No City.");
                            //syncLog('    No City.');
                            nextStep();
                        }
                        else {
                            for (var i = 0; i < CityListInfo.CityList.length; i++) {
                                //$("#shopname").append("<option value='" + ShopListInfo.ShopList[i].StoreID + "'>" + ShopListInfo.ShopList[i].Store + "</option>");
                                //console.log("'" + ShopListInfo.ShopList[i].StoreID + "', '" + ShopListInfo.ShopList[i].CityID + "', '" + ShopListInfo.ShopList[i].TownID + "', '" + ShopListInfo.ShopList[i].Store + "', '" + ShopListInfo.ShopList[i].inventoryqty + "', '" + ShopListInfo.ShopList[i].CreateTime + "', '" + ShopListInfo.ShopList[i].ModifyTime + "'");
                                updateCity(CityListInfo.CityList[i]);
                            }
                        }
                    }
                    else {
                        $.unblockUI();
                        alert(CityListInfo.msg);
                    }

                    function updateCity(CityInfo) {
                        sqlitesync_DB.transaction(function (tx) {
                            iInsert++;
                            tx.executeSql('INSERT INTO City (adl5_name, adl2_name) VALUES (?, ?)',
                                      [CityInfo.adl5_name,
                                       CityInfo.adl2_name]);

                            //console.log('Insert city : ' + iInsert + '\nUpdate city : ' + iUpdate);
                            if (iInsert + iUpdate == CityListInfo.CityList.length) {
                                //console.log('Insert city : ' + iInsert + ', Update city : ' + iUpdate);
                                //syncLog('    Insert city : ' + iInsert + ', Update city : ' + iUpdate);
                                nextStep();
                            }
                        });
                    }

                    function nextStep() {
                        getTableAgent();
                    }
                },
                error: AjaxError
            });
        }

        function getTableAgent() {
            $.unblockUI();
            $.blockUI({ message: '<h1>Initializing 6/7</h1>' });
            //console.log('getTableCity');
            //syncLog('Sync city');
            Url = UrlBase + ServiceName + "/GetAgentList";
            Data = '';
            ContentType = "application/json; charset=utf-8";
            DataType = "json";

            $.support.cors = true;

            $.ajax({
                type: Type, //GET or POST or PUT or DELETE verb
                url: Url, // Location of the service
                data: Data, //Data sent to server
                contentType: ContentType, // content type sent to server
                dataType: DataType, //Expected data format from server
                timeout: ajaxTimeout,
                success: function (msg) {//On Successfull service call
                    var iInsert = 0;
                    var AgentListInfo = JSON.parse(msg.GetAgentListResult);
                    if (AgentListInfo.msg == "OK") {
                        sqlitesync_DB.transaction(function (tx) {
                            tx.executeSql("Delete From [Agent];", [], deleteAgentSuccess, errorDeleteAgent);
                        });
                    }
                    else {
                        $.unblockUI();
                        alert(AgentListInfo.msg);
                    }

                    function errorDeleteAgent(err) {
                        $('#verify_sync').addClass('ui-disabled');
                        $('#selectAddress_sync').addClass('ui-disabled');
                        $('#syncLogPage_sync').addClass('ui-disabled');
                        alert('Delete Agent error.' + 'Error processing SQL: ' + err.code);
                        //console.log("Error processing SQL: " + err.code);
                    }
                    function deleteAgentSuccess(tx, results) {
                        //alert('deleteAgentSuccess');
                        if (AgentListInfo.AgentList.length == 0) {
                            //console.log("No City.");
                            //syncLog('    No City.');
                            nextStep();
                        }
                        else {
                            //alert('AgentListInfo.AgentList.length : ' + AgentListInfo.AgentList.length);
                            for (var i = 0; i < AgentListInfo.AgentList.length; i++) {
                                //$("#shopname").append("<option value='" + ShopListInfo.ShopList[i].StoreID + "'>" + ShopListInfo.ShopList[i].Store + "</option>");
                                //console.log("'" + ShopListInfo.ShopList[i].StoreID + "', '" + ShopListInfo.ShopList[i].CityID + "', '" + ShopListInfo.ShopList[i].TownID + "', '" + ShopListInfo.ShopList[i].Store + "', '" + ShopListInfo.ShopList[i].inventoryqty + "', '" + ShopListInfo.ShopList[i].CreateTime + "', '" + ShopListInfo.ShopList[i].ModifyTime + "'");
                                updateAgent(AgentListInfo.AgentList[i]);
                            }
                        }
                    }

                    function updateAgent(AgentInfo) {
                        //alert('updateAgent');
                        sqlitesync_DB.transaction(function (tx) {
                            tx.executeSql('INSERT INTO [Agent] ([Name], [Password]) VALUES (?, ?)',
                                                      [AgentInfo.Name, AgentInfo.Password], insertAgentSuccess, errorInsertAgent);

                            function errorInsertAgent(err) {
                                $('#verify_sync').addClass('ui-disabled');
                                $('#selectAddress_sync').addClass('ui-disabled');
                                $('#syncLogPage_sync').addClass('ui-disabled');
                                alert('Insert Agent error.' + 'Error processing SQL: ' + err.code);
                                //console.log("Error processing SQL: " + err.code);
                            }
                            function insertAgentSuccess(tx, results) {
                                iInsert++;
                                //alert('insertAgentSuccess ' + iInsert);

                                //console.log('Insert city : ' + iInsert + '\nUpdate city : ' + iUpdate);
                                if (iInsert == AgentListInfo.AgentList.length) {
                                    //console.log('Insert city : ' + iInsert + ', Update city : ' + iUpdate);
                                    //syncLog('    Insert city : ' + iInsert + ', Update city : ' + iUpdate);
                                    nextStep();
                                }
                            }
                        });
                    }

                    function nextStep() {
                        getBasicInfo();
                        //$.unblockUI();
                        //alert('Initialized!');
                        //getTableLocation();

                        //if (agt_id != '')
                        //    myDBSync();
                    }
                },
                error: AjaxError
            });
        }

        function getBasicInfo() {
            $.unblockUI();
            $.blockUI({ message: '<h1>Initializing 7/7</h1>' });
            sqlitesync_DB.transaction(function (tx) {
                tx.executeSql("Select * From [BasicInfo];",
                                  [], checkBasicInfoSuccess, errorCheckBasicInfo);

                function errorCheckBasicInfo(err) {
                    $('#verify_sync').addClass('ui-disabled');
                    $('#selectAddress_sync').addClass('ui-disabled');
                    $('#syncLogPage_sync').addClass('ui-disabled');
                    alert('Check basicinfo error.' + 'Error processing SQL: ' + err.code);
                    //console.log("Error processing SQL: " + err.code);
                }
                function checkBasicInfoSuccess(tx, results) {
                    if (results.rows.length == 0) {
                        $('#verify_sync').addClass('ui-disabled');
                        $('#selectAddress_sync').addClass('ui-disabled');
                        $('#syncLogPage_sync').addClass('ui-disabled');
                        tx.executeSql("Insert Into [BasicInfo] ([agt_id], [lastUpdateTime]) Values(?, ?);",
                                              [agt_id, lastUpdateTime], insertBasicInfoSuccess, errorInsertBasicInfo);
                        //navigator.notification.alert('Table store not exist.', nullAlert, 'Check Table', 'OK');
                    }
                    else {
                        //console.log("Check basicinfo success");
                        //$('#setAgt_Id').show();

                        agt_id = results.rows.item(0).agt_id;
                        lastUpdateTime = '1900-1-1';
                        tx.executeSql("Update [BasicInfo] Set [lastUpdateTime]='1900-1-1';",
                                              [], updateBasicInfoSuccess, errorUpdateBasicInfo);
                    }

                    function insertBasicInfoSuccess(tx, results) {
                        //console.log('Insert blank BasicInfo OK.');
                        //$('#setAgt_Id').show();
                        $('#divAgt_id').show();
                        nextStep();
                        //alert('Initialize OK!');
                        //myDBSync();
                    }
                    function errorInsertBasicInfo(err) {
                        //console.log("Error processing SQL: " + err.code);
                        alert('Insert basicinfo error.' + 'Error processing SQL: ' + err.code);
                    }

                    function updateBasicInfoSuccess(tx, results) {
                        $('#agt_id').val(agt_id);
                        $('#divAgt_id').show();

                        if (agt_id == '') {
                            $('#verify_sync').addClass('ui-disabled');
                            $('#selectAddress_sync').addClass('ui-disabled');
                            $('#syncLogPage_sync').addClass('ui-disabled');
                        }
                        else {
                            $('#verify_sync').removeClass('ui-disabled');
                            $('#selectAddress_sync').removeClass('ui-disabled');
                            $('#syncLogPage_sync').removeClass('ui-disabled');
                        }

                        nextStep();
                    }
                    function errorUpdateBasicInfo(err) {
                        //console.log("Error processing SQL: " + err.code);
                        alert('Update basicinfo error.' + 'Error processing SQL: ' + err.code);
                    }

                    function nextStep() {
                        $.unblockUI();
                        alert('Initialized!');
                        //getTableLocation();

                        if (agt_id != '')
                            myDBSync();
                        else
                            $.mobile.changePage("verify.html#setAgentDialog", { role: "dialog" });
                    }
                }
            });
        }
    });
}

function myDBSync(myDBSyncOK)   {
    // 從 SQL Server 下載 Cities / Towns
    //console.log("myDBSync");

    $.blockUI({ message: '<h1>Synchronizing</h1>' });
    var upLocSuccess = [];      // 上傳成功的項目
    var upPhotoSuccess = [];    // 上傳成功的照片
    var syncLogs = [];
    var dnInsertCount = 0, dnUpdateCount = 0;   // 下載 Location 新增 / 更新 的筆數
    var syncTime = dateTimeToUTCStr(new Date());

    //uploadLocation();
    getTableLocation();

    // 更新 SQL Server 的 Location / photo

    function getTableLocation() {
        $.unblockUI();
        $.blockUI({ message: '<h1>Synchronizing 1/5</h1>' });
        //alert('1');
        //console.log("getTableLocation");
        //syncLog('Download location');
        //Url = UrlBase + ServiceName + "/GetShopList";
        //Data = '{"TownID": ""}';    // 須加上 lastUpdate 時間判斷，只取回更新的資料
        Url = UrlBase + ServiceName + "/GetLocationListByUpdateTime";
        Data = '{"lastTime": "' + lastUpdateTime + '"}';    // 須加上 lastUpdate 時間判斷，只取回更新的資料
        ContentType = "application/json; charset=utf-8";
        DataType = "json";

        $.support.cors = true;

        // 先從主機下載 Location 資料 (modifyTime 需大於手機的最後同步時間且 flag <> 5)
        $.ajax({
            type: Type, //GET or POST or PUT or DELETE verb
            url: Url, // Location of the service
            data: Data, //Data sent to server
            contentType: ContentType, // content type sent to server
            dataType: DataType, //Expected data format from server
            timeout: ajaxTimeout,
            success: function (msg) {//On Successfull service call
                //console.log("getTableLocation success");
                var iInsert = 0, iUpdate = 0;
                var LocationListInfo = JSON.parse(msg.GetLocationListByUpdateTimeResult);
                if (LocationListInfo.msg == "OK") {
                    //alert('Locations (' + LocationListInfo.LocationList.length + ')');
                    if (LocationListInfo.LocationList.length == 0) {
                        //console.log("Location are all updated.");
                        //syncLog('    Location are all updated.');
                        nextStep();
                    }
                    else {
                        //alert('location count : ' + LocationListInfo.LocationList.length);
                        for (var i = 0; i < LocationListInfo.LocationList.length; i++) {
                            //console.log("'" + ShopListInfo.ShopList[i].StoreID + "', '" + ShopListInfo.ShopList[i].CityID + "', '" + ShopListInfo.ShopList[i].TownID + "', '" + ShopListInfo.ShopList[i].Store + "', '" + ShopListInfo.ShopList[i].inventoryqty + "', '" + ShopListInfo.ShopList[i].CreateTime + "', '" + ShopListInfo.ShopList[i].ModifyTime + "'");
                            updateLocation(LocationListInfo.LocationList[i]);
                        }
                    }
                }
                else {
                    $.unblockUI();
                    alert(LocationListInfo.msg);
                    showSyncResult();
                }

                function updateLocation(LocationInfo) {
                    sqlitesync_DB.transaction(function (tx) {
                        // 讀出 Local DB 裡 相對的 Location 的 modifyTime
                        tx.executeSql("Select [clt_id], [objid], [modifyTime] From [Location] Where [clt_id]=? and [objid]=?;",
                                      [LocationInfo.clt_id, LocationInfo.objid], checkLocationSuccess, errorCheckLocation);
                    });

                    function checkLocationSuccess(tx, results) {
                        if (results.rows.length == 0) {
                            if (LocationInfo.agt_id == agt_id && (LocationInfo.flag == '3' || LocationInfo.flag == '4')) dnInsertCount++;

                            // 下載的資料，若是 Insert 則全部資欄位都寫入(包含 modifyTime / Flag)
                            //iInsert++;
                            //                                alert(LocationInfo.clt_id+','+
                            //                                                     LocationInfo.objid+','+
                            //                                                     LocationInfo.adl1_name+','+
                            //                                                     LocationInfo.adl5_name+','+
                            //                                                     LocationInfo.adl2_name+','+
                            //                                                     LocationInfo.agt_id+','+
                            //                                                     LocationInfo.name_e+','+
                            //                                                     LocationInfo.address_e+','+
                            //                                                     LocationInfo.x_lat+','+
                            //                                                     LocationInfo.y_long+','+
                            //                                                     LocationInfo.busstop+','+
                            //                                                     LocationInfo.polic+','+
                            //                                                     LocationInfo.landmark+','+
                            //                                                     LocationInfo.rd_s_asph+','+
                            //                                                     LocationInfo.lu_type+','+
                            //                                                     LocationInfo.surv_psn+','+
                            //                                                     LocationInfo.surv_psn_others+','+
                            //                                                     LocationInfo.cmt_tgt+','+
                            //                                                     LocationInfo.obj_vst_yn+','+
                            //                                                     LocationInfo.objv_y_des+','+
                            //                                                     LocationInfo.objv_n_des+','+
                            //                                                     LocationInfo.res_yn+','+
                            //                                                     LocationInfo.res_n_des+','+
                            //                                                     LocationInfo.cmt_res_y+','+
                            //                                                     LocationInfo.cmt_v_name+','+
                            //                                                     LocationInfo.cmt_nofind+','+
                            //                                                     LocationInfo.note+','+
                            //                                                     LocationInfo.createTime+','+
                            //                                                     LocationInfo.startTime+','+
                            //                                                     LocationInfo.modifyTime+','+
                            //                                                     LocationInfo.expirationTime+','+
                            //                                                     LocationInfo.flag);
                            tx.executeSql('INSERT INTO [Location] ([clt_id], [objid], [adl1_name], [adl5_name], [adl2_name], [agt_id], [name_e], [address_e], [x_lat], [y_long], [busstop], [polic], [landmark],' +
                                            ' [rd_s_asph], [lu_type], [surv_psn], [surv_psn_others], [cmt_tgt], [obj_vst_yn], [objv_y_des], [objv_n_des], [res_yn], [res_n_des], [cmt_res_y], [cmt_v_name], [cmt_nofind],' +
                                            ' [note], [createTime], [startTime], [modifyTime], [expirationTime], [flag])' +
                                            ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                                                [LocationInfo.clt_id,
                                                    LocationInfo.objid,
                                                    LocationInfo.adl1_name,
                                                    LocationInfo.adl5_name,
                                                    LocationInfo.adl2_name,
                                                    LocationInfo.agt_id,
                                                    LocationInfo.name_e,
                                                    LocationInfo.address_e,
                                                    LocationInfo.x_lat,
                                                    LocationInfo.y_long,
                                                    LocationInfo.busstop,
                                                    LocationInfo.polic,
                                                    LocationInfo.landmark,
                                                    LocationInfo.rd_s_asph,
                                                    LocationInfo.lu_type,
                                                    LocationInfo.surv_psn,
                                                    LocationInfo.surv_psn_others,
                                                    LocationInfo.cmt_tgt,
                                                    LocationInfo.obj_vst_yn,
                                                    LocationInfo.objv_y_des,
                                                    LocationInfo.objv_n_des,
                                                    LocationInfo.res_yn,
                                                    LocationInfo.res_n_des,
                                                    LocationInfo.cmt_res_y,
                                                    LocationInfo.cmt_v_name,
                                                    LocationInfo.cmt_nofind,
                                                    LocationInfo.note,
                                                    LocationInfo.createTime,
                                                    LocationInfo.startTime,
                                                    LocationInfo.modifyTime,
                                                    LocationInfo.expirationTime,
                                                    LocationInfo.flag], insertLocationSuccess, errorInsertLocation);
                        }
                        else {
                            if (LocationInfo.agt_id == agt_id && (LocationInfo.flag == '3' || LocationInfo.flag == '4')) dnUpdateCount++;

                            // 若是 Update 則只更新基本資料(不包含 modifyTime / Flag)
                            //console.log('ModifyTime : ' + results.rows.item(0).modifyTime + ', Server ModifyTime : ' + LocationInfo.modifyTime);
                            //iUpdate++;
                            if (LocationInfo.flag == '3' || LocationInfo.flag == '4')
                                tx.executeSql('Update [Location] Set [adl1_name]=?, [adl5_name]=?, [adl2_name]=?, [agt_id]=?, [name_e]=?, [address_e]=?, [expirationTime]=?' +
                                            ' Where [clt_id]=? and [objid]=?',
                                                [LocationInfo.adl1_name,
                                                    LocationInfo.adl5_name,
                                                    LocationInfo.adl2_name,
                                                    LocationInfo.agt_id,
                                                    LocationInfo.name_e,
                                                    LocationInfo.address_e,
                                                    LocationInfo.expirationTime,
                                                    LocationInfo.clt_id,
                                                    LocationInfo.objid], updateLocationSuccess, errorUpdateLocation);
                            else
                                tx.executeSql('Update [Location] Set [adl1_name]=?, [adl5_name]=?, [adl2_name]=?, [agt_id]=?, [name_e]=?, [address_e]=?, [expirationTime]=?, [flag]=?' +
                                            ' Where [clt_id]=? and [objid]=?',
                                                [LocationInfo.adl1_name,
                                                    LocationInfo.adl5_name,
                                                    LocationInfo.adl2_name,
                                                    LocationInfo.agt_id,
                                                    LocationInfo.name_e,
                                                    LocationInfo.address_e,
                                                    LocationInfo.expirationTime,
                                                    LocationInfo.flag,
                                                    LocationInfo.clt_id,
                                                    LocationInfo.objid], updateLocationSuccess, errorUpdateLocation);

                        }

                        //console.log('Insert store : ' + iInsert + '\nUpdate store : ' + iUpdate);
                        //if (iInsert + iUpdate == LocationListInfo.LocationList.length) {
                        //console.log('Insert location : ' + iInsert + ', Update location : ' + iUpdate);
                        //syncLog('    Insert location : ' + iInsert + ', Update location : ' + iUpdate);
                        //    nextStep();
                        //}
                    }

                    function errorCheckLocation(err) {
                        $.unblockUI();
                        alert('Check Location error.' + 'Error processing SQL: ' + err.code);
                        showSyncResult();
                        //console.log("Error processing SQL: " + err.code);
                    }

                    function insertLocationSuccess(tx, results) {
                        iInsert++;
                        if (iInsert + iUpdate == LocationListInfo.LocationList.length) {
                            nextStep();
                        }
                    }
                    function errorInsertLocation(err) {
                        alert('Insert Location error.' + 'Error processing SQL: ' + err.code);
                        if (iInsert + iUpdate == LocationListInfo.LocationList.length) {
                            $.unblockUI();
                            showSyncResult();
                        }
                    }
                    function updateLocationSuccess(tx, results) {
                        iUpdate++;
                        if (iInsert + iUpdate == LocationListInfo.LocationList.length) {
                            nextStep();
                        }
                    }
                    function errorUpdateLocation(err) {
                        alert('Update Location error.' + 'Error processing SQL: ' + err.code);
                        if (iInsert + iUpdate == LocationListInfo.LocationList.length) {
                            $.unblockUI();
                            showSyncResult();
                        }
                    }
                }

                function nextStep() {
                    //mySyncEnd();
                    clearLocation();
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                AjaxError(xhr, ajaxOptions, thrownError);
                showSyncResult();
            }
        });
    }

    // 清掉不屬於 agent 的資料，且刪除 flag 為 5, 7, 9 的資料
    function clearLocation() {
        $.unblockUI();
        $.blockUI({ message: '<h1>Synchronizing 2/5</h1>' });
        sqlitesync_DB.transaction(function (tx) {
            //alert(agt_id);
            // 下載後只保留屬於 Agent 的資料，且 Flag = 3 / 4 / 5，且 expirationTime > 現在時間
            tx.executeSql("Delete From [Location] Where ([agt_id] <> ?) or ([flag] not in ('3', '4', '5')) or ([expirationTime] <= ?);",
                          [agt_id, dateTimeToUTCStr(new Date())], clearLocationSuccess, errorClearLocation);
        });

        function errorClearLocation(err) {
            $.unblockUI();
            alert('Clear Location error.' + 'Error processing SQL: ' + err.code);
            showSyncResult();
            //console.log("Error processing SQL: " + err.code);
            //navigator.notification.alert('Check Table error.', checkInternet, 'checkTable', 'OK');
        }

        function clearLocationSuccess(tx, results) {
            //mySyncEnd();
            uploadLocation();
        }
    }

    function uploadLocation() {
        $.unblockUI();
        $.blockUI({ message: '<h1>Synchronizing 3/5</h1>' });
        //console.log("uploadLocation");
        //syncLog('Upload location');
        //alert('2');
        //$.blockUI();

        // 把更新過的資料從 Offline DB 讀出
        // 回傳更新主機的資料
        sqlitesync_DB.transaction(function (tx) {
            // 上傳資料時，把 Flag = 4 / 5，且 modifyTime >= 最後同步時間的 Location 上傳更新
            // 須加上過濾條件
            // 須加上 lastUpdate 時間判斷，只取回更新的資料
            tx.executeSql("SELECT [clt_id], [objid], [adl1_name], [adl5_name], [adl2_name], [agt_id], [name_e], [address_e], [x_lat], [y_long], [busstop], [polic], [landmark], [rd_s_asph], [lu_type], [surv_psn]," +
                          " [surv_psn_others], [cmt_tgt], [obj_vst_yn], [objv_y_des], [objv_n_des], [res_yn], [res_n_des], [cmt_res_y], [cmt_v_name], [cmt_nofind], [note], strftime('%Y-%m-%d %H:%M:%S', [createTime]) as [createTime]," +
                          " strftime('%Y-%m-%d %H:%M:%S', [startTime]) as [startTime], strftime('%Y-%m-%d %H:%M:%S', [modifyTime]) as [modifyTime], [flag]" +
                          " FROM [Location] Where [agt_id]=? and [modifyTime]>=? and [flag] in ('4', '5') Order By [clt_id], [objid];",
                            [agt_id, lastUpdateTime], selectLocationsSuccess, errorSelectLocations);
        });
        var locCount;
        var iUpload = 0;

        function errorSelectLocations(err) {
            alert('Get location for update error.' + 'Error processing SQL: ' + err.code);
            showSyncResult();
            //console.log("Error processing SQL: " + err.code);
            //navigator.notification.alert('Check Table error.', checkInternet, 'checkTable', 'OK');
        }
        function selectLocationsSuccess(tx, results) {
            //alert('Upload location count : ' + results.rows.length);
            if (results.rows.length == 0) {
                //navigator.notification.alert('Table store not exist.', nullAlert, 'Check Table', 'OK');
                //console.log('No location for upload found.');
                //syncLog('    No location for upload found.');
                nextStep();
            }
            else {
                //navigator.notification.alert('Table store exist.', nullAlert, 'Check Table', 'OK');
                //alert('Table ' + checkTable + ' exist.');
                locCount = results.rows.length;

                //console.log("Upload location (" + results.rows.length + ")");

                for (i = 0; i < locCount; i++) {
                    //console.log('Upload store (' + i + ')');
                    //$("#City").append("<option value='" + results.rows.item(i).CityID + "'>" + results.rows.item(i).City + "</option>");

                    //alert('modifytime : ' + results.rows.item(i).modifyTime);
                    Url = UrlBase + ServiceName + "/UploadLocation";
                    Data = '{"clt_id": "' + results.rows.item(i).clt_id + '", ' +
                            '"objid" : "' + results.rows.item(i).objid + '", ' +
                            '"adl1_name" : "' + results.rows.item(i).adl1_name + '", ' +
                            '"adl5_name" : "' + results.rows.item(i).adl5_name + '", ' +
                            '"adl2_name" : "' + results.rows.item(i).adl2_name + '", ' +
                            '"agt_id" : "' + results.rows.item(i).agt_id + '", ' +
                            '"name_e" : "' + results.rows.item(i).name_e + '", ' +
                            '"address_e" : "' + results.rows.item(i).address_e + '", ' +
                            '"x_lat" : "' + results.rows.item(i).x_lat + '", ' +
                            '"y_long" : "' + results.rows.item(i).y_long + '", ' +
                            '"busstop" : "' + results.rows.item(i).busstop + '", ' +
                            '"polic" : "' + results.rows.item(i).polic + '", ' +
                            '"landmark" : "' + results.rows.item(i).landmark + '", ' +
                            '"rd_s_asph" : "' + results.rows.item(i).rd_s_asph + '", ' +
                            '"lu_type" : "' + results.rows.item(i).lu_type + '", ' +
                            '"surv_psn" : "' + results.rows.item(i).surv_psn + '", ' +
                            '"surv_psn_others" : "' + results.rows.item(i).surv_psn_others + '", ' +
                            '"cmt_tgt" : "' + results.rows.item(i).cmt_tgt + '", ' +
                            '"obj_vst_yn" : "' + results.rows.item(i).obj_vst_yn + '", ' +
                            '"objv_y_des" : "' + results.rows.item(i).objv_y_des + '", ' +
                            '"objv_n_des" : "' + results.rows.item(i).objv_n_des + '", ' +
                            '"res_yn" : "' + results.rows.item(i).res_yn + '", ' +
                            '"res_n_des" : "' + results.rows.item(i).res_n_des + '", ' +
                            '"cmt_res_y" : "' + results.rows.item(i).cmt_res_y + '", ' +
                            '"cmt_v_name" : "' + results.rows.item(i).cmt_v_name + '", ' +
                            '"cmt_nofind" : "' + results.rows.item(i).cmt_nofind + '", ' +
                            '"note" : "' + results.rows.item(i).note + '", ' +
                            '"createTime" : "' + results.rows.item(i).createTime + '", ' +
                            '"startTime" : "' + results.rows.item(i).startTime + '", ' +
                            '"modifyTime" : "' + results.rows.item(i).modifyTime + '", ' +
                            '"flag" :"' + results.rows.item(i).flag + '"}';
                    ContentType = "application/json; charset=utf-8";
                    DataType = "json";

                    //console.log(Data);

                    $.support.cors = true;

                    $.ajax({
                        type: Type, //GET or POST or PUT or DELETE verb
                        url: Url, // Location of the service
                        processData: false,
                        data: Data, //Data sent to server
                        contentType: ContentType, // content type sent to server
                        dataType: DataType, //Expected data format from server
                        timeout: ajaxTimeout,
                        success: function (msg) {//On Successfull service call
                            //console.log(msg.UploadLocationResult);
                            var UploadLocationInfo = JSON.parse(msg.UploadLocationResult);
                            //alert(UploadLocationInfo);
                            if (UploadLocationInfo.msg == "OK") {
                                if (UploadLocationInfo.msg1 != null) alert(UploadLocationInfo.msg1);
                                //alert(UploadStoresInfo.result);
                                iUpload++;

                                insertSyncLog(UploadLocationInfo);
                                //deleteLocation();
                                //alert(agt_id + ',' + UploadLocationInfo.clt_id + ',' + UploadLocationInfo.objid + ',' + UploadLocationInfo.createTime);
                            }
                            else {
                                alert(UploadLocationInfo.msg);
                                if (i == locCount - 1) {
                                    $.unblockUI();
                                    showSyncResult();
                                }
                            }
                        },
                        error: function (xhr, ajaxOptions, thrownError) {
                            AjaxError(xhr, ajaxOptions, thrownError);
                            if (i == locCount - 1) showSyncResult();
                        }
                    });
                }
            }
        }

        function insertSyncLog(UploadLocationInfo) {
            upLocSuccess.push(UploadLocationInfo.clt_id + '_' + UploadLocationInfo.objid);
            syncLogs.push(UploadLocationInfo.clt_id + ',' + UploadLocationInfo.objid + ',,' + syncTime);
            // 若 Flag = 5，則刪除該筆資料
            if (UploadLocationInfo.flag == '5')
                deleteLocation(UploadLocationInfo);
            else if (iUpload == locCount)
                nextStep();

            //sqlitesync_DB.transaction(function (tx) {
                // 上傳成功後，寫入手機中的 Sync Log
            //    tx.executeSql("Insert Into [SyncLog] ([clt_id], [objid], [syncTime]) Values (?, ?, ?);",
            //                    [UploadLocationInfo.clt_id, UploadLocationInfo.objid, syncTime], syncLogSuccess, errorSyncLog);
            //});

            function syncLogSuccess(tx, delresults) {
                upLocSuccess.push(UploadLocationInfo.clt_id + '_' + UploadLocationInfo.objid);

                // 若 Flag = 5，則刪除該筆資料
                if (UploadLocationInfo.flag == '5')
                    deleteLocation(UploadLocationInfo);
                else if (iUpload == locCount)
                    nextStep();

                //alert('syncLogSuccess');
            }
            function errorSyncLog(err) {
                alert('Sync log for location ' + iUpload + ' error.' + 'Error processing SQL: ' + err.code);
                if (iUpload == locCount) {
                    $.unblockUI();
                    showSyncResult();
                }
            }
        }

        function deleteLocation(UploadLocationInfo) {
            sqlitesync_DB.transaction(function (tx) {
                tx.executeSql("Delete From [Location] Where [agt_id]=? and [clt_id]=? and [objid]=? and strftime('%Y-%m-%d %H:%M:%S', [createTime])=? and [flag]='5';",
                                                [agt_id, UploadLocationInfo.clt_id, UploadLocationInfo.objid, UploadLocationInfo.createTime], deleteLocationSuccess, errorDeleteLocation);
            });

            function deleteLocationSuccess(tx, delresults) {
                if (iUpload == locCount)
                    nextStep();
            }
            function errorDeleteLocation(err) {
                alert('Delete location error.' + 'Error processing SQL: ' + err.code);
                if (iUpload == locCount) {
                    $.unblockUI();
                    showSyncResult();
                }
            }
        }

        function nextStep() {
            uploadLocationPhoto();
        }
    }

    function uploadLocationPhoto() {
        $.unblockUI();
        $.blockUI({ message: '<h1>Synchronizing 4/5</h1>' });
        //console.log("uploadLocationPhoto");
        //syncLog('Upload location photos');
        //alert('2');
        //$.blockUI();

        var photoCount;
        var iUpload = 0;
        // 把更新過的資料從 Offline DB 讀出
        // 回傳更新主機的資料
        sqlitesync_DB.transaction(function (tx) {
            // 須加上過濾條件
            // 須加上 lastUpdate 時間判斷，只取回更新的資料
            tx.executeSql("SELECT [clt_id], [objid], [photoData], [name_e], [notes], [x_lat], [y_long], strftime('%Y-%m-%d %H:%M:%S', [photoTime]) as [photoTime] " +
                          "FROM [photo] Where [photoTime]>=? Order By [clt_id], [objid], [photoTime];",
                          [lastUpdateTime], selectLocationPhotoSuccess, errorSelectLocationPhoto);
        });
        function errorSelectLocationPhoto(err) {
            alert('Get location photo for update error.' + 'Error processing SQL: ' + err.code);
            showSyncResult();
            //console.log("Error processing SQL: " + err.code);
            //navigator.notification.alert('Check Table error.', checkInternet, 'checkTable', 'OK');
        }
        function selectLocationPhotoSuccess(tx, results) {
            //alert('Upload photo count : ' + results.rows.length);
            if (results.rows.length == 0) {
                //navigator.notification.alert('Table store not exist.', nullAlert, 'Check Table', 'OK');
                //console.log('No location photo for upload found.');
                //syncLog('    No location photo for upload found.');
                nextStep();
            }
            else {
                //navigator.notification.alert('Table store exist.', nullAlert, 'Check Table', 'OK');
                photoCount = results.rows.length;

                //console.log("Upload location photo (" + results.rows.length + ")");
                //alert("Upload location photo (" + photoCount + ")");

                for (i = 0; i < photoCount; i++) {
                    Url = UrlBase + ServiceName + "/UploadLocationPhoto";
                    Data = '{"clt_id": "' + results.rows.item(i).clt_id + '", ' +
                                '"objid" : "' + results.rows.item(i).objid + '", ' +
                                '"photoData" : "' + results.rows.item(i).photoData + '", ' +
                                '"name_e" : "' + results.rows.item(i).name_e + '", ' +
                                '"notes" : "' + results.rows.item(i).notes + '", ' +
                                '"x_lat" : "' + results.rows.item(i).x_lat + '", ' +
                                '"y_long" : "' + results.rows.item(i).y_long + '", ' +
                                '"photoTime" : "' + results.rows.item(i).photoTime + '"}';
                    ContentType = "application/json; charset=utf-8";
                    DataType = "json";

                    $.support.cors = true;

                    $.ajax({
                        type: Type, //GET or POST or PUT or DELETE verb
                        url: Url, // Location of the service
                        data: Data, //Data sent to server
                        contentType: ContentType, // content type sent to server
                        dataType: DataType, //Expected data format from server
                        timeout: ajaxTimeout,
                        success: function (msg) {//On Successfull service call
                            var UploadLocationPhotoInfo = JSON.parse(msg.UploadLocationPhotoResult);
                            if (UploadLocationPhotoInfo.msg == "OK") {
                                if (UploadLocationPhotoInfo.msg1 != null) alert(UploadLocationPhotoInfo.msg1);
                                iUpload++;

                                insertSyncLog(UploadLocationPhotoInfo);
                                //deletePhoto();
                            }
                            else {
                                alert(UploadLocationPhotoInfo.msg);
                                if (i == photoCount - 1) {
                                    $.unblockUI();
                                    showSyncResult();
                                }
                            }
                        },
                        error: function (xhr, ajaxOptions, thrownError) {
                            AjaxError(xhr, ajaxOptions, thrownError);
                            if (i == photoCount - 1) showSyncResult();
                        }
                    });
                }
            }
        }

        function insertSyncLog(UploadLocationPhotoInfo) {
            deletePhoto(UploadLocationPhotoInfo);

            //sqlitesync_DB.transaction(populateDB, errorCB, successCB);
            //sqlitesync_DB.transaction(populateDB);
            //alert(UploadLocationPhotoInfo.clt_id + '\n' + UploadLocationPhotoInfo.objid + '\n' + UploadLocationPhotoInfo.photoTime + '\n' + syncTime);
            function populateDB(tx) {
                try {
                    var clt_id = UploadLocationPhotoInfo.clt_id;
                    var objid = UploadLocationPhotoInfo.objid;
                    var photoTime = UploadLocationPhotoInfo.photoTime;
                    //alert(UploadLocationPhotoInfo.clt_id + '\n' + UploadLocationPhotoInfo.objid + '\n' + UploadLocationPhotoInfo.photoTime + '\n' + syncTime);
                    //alert(clt_id + '\n' + objid + '\n' + photoTime + '\n' + syncTime);
                    tx.executeSql("Insert Into SyncLog([clt_id], [objid], [photoTime], [syncTime]) Values(?, ?, ?, ?)",
                    //[UploadLocationPhotoInfo.clt_id, UploadLocationPhotoInfo.objid, UploadLocationPhotoInfo.photoTime, syncTime],
                                                      [clt_id, objid, photoTime, syncTime],
                                                      syncLogPhotoSuccess, errorSyncLogPhoto);
                    //    tx.executeSql("Insert Into SyncLog([clt_id], [objid], [photoTime], [syncTime]) Values(?, ?, ?, ?)",
                    //                  [UploadLocationPhotoInfo.clt_id, UploadLocationPhotoInfo.objid, UploadLocationPhotoInfo.photoTime, syncTime],
                    //                  syncLogPhotoSuccess, errorSyncLogPhoto);
                    //tx.executeSql("Insert Into [SyncLog] ([clt_id], [objid], [photoTime], [syncTime]) Values ('Diamond Bank', '1000019', '2014-08-08 09:28:48', '2014-08-11 02:00:48');",
                    //              [], syncLogPhotoSuccess, errorSyncLogPhoto);
                    //tx.executeSql("Insert Into [SyncLog] ([clt_id], [objid], [syncTime]) Values ('Diamond Bank', '1000019', '2014-08-11 02:00:48')",
                    //              [], syncLogPhotoSuccess, errorSyncLogPhoto);
                    //tx.executeSql("Select [clt_id], [objid], [photoTime], [syncTime] From [SyncLog];",
                    //              [], syncLogPhotoSuccess, errorSyncLogPhoto);
                }
                catch (err) {
                    alert(err.message);
                }
            }
            function syncLogPhotoSuccess(tx, results) {
                //$.unblockUI();
                //alert('before deletePhoto');
                deletePhoto(UploadLocationPhotoInfo);
            }
            function errorSyncLogPhoto(err) {
                alert('Sync log for photo ' + iUpload + ' error.' + 'Error processing SQL: ' + err.code + ',' + err.message);
                if (iUpload == photoCount) {
                    $.unblockUI();
                    showSyncResult();
                }
            }
            function errorCB(err) {
                alert("Transaction Error processing SQL: " + err.code + ',' + err.message);
                if (iUpload == photoCount) {
                    $.unblockUI();
                    showSyncResult();
                }
            }
            function successCB() {
                alert("Transaction success!");
            }
        }

        function deletePhoto(UploadLocationPhotoInfo) {
            //alert('deletePhoto');
            syncLogs.push(UploadLocationPhotoInfo.clt_id + ',' + UploadLocationPhotoInfo.objid + ',' + UploadLocationPhotoInfo.photoTime + ',' + syncTime);
            upPhotoSuccess.push(UploadLocationPhotoInfo.clt_id + '_' + UploadLocationPhotoInfo.objid);
            sqlitesync_DB.transaction(function (tx) {
                //alert(UploadLocationPhotoInfo.clt_id + ',' + UploadLocationPhotoInfo.objid + ',' + UploadLocationPhotoInfo.photoTime);
                tx.executeSql("Delete From [photo] Where [clt_id]=? and [objid]=? and strftime('%Y-%m-%d %H:%M:%S', [photoTime])=?;",
                                [UploadLocationPhotoInfo.clt_id, UploadLocationPhotoInfo.objid, UploadLocationPhotoInfo.photoTime],
                                deletePhotoSuccess, errorDeletePhoto);
            });
            function deletePhotoSuccess(tx, results) {
                //alert('deletePhotoSuccess');
                //alert(iUpload + ',' + photoCount);
                if (iUpload == photoCount) {
                    //syncLog('    Upload location photos (' + iUpload + ')');
                    nextStep();
                }
            }
            function errorDeletePhoto(err) {
                $.unblockUI();
                alert('Delete location photo error.' + 'Error processing SQL: ' + err.code);
                if (iUpload == photoCount) {
                    $.unblockUI();
                    showSyncResult();
                }
            }
        }

        function nextStep() {
            //getTableLocation();
            writeSyncLog();
            //mySyncEnd();
        }
    }

    function writeSyncLog()
    {
        $.unblockUI();
        $.blockUI({ message: '<h1>Synchronizing 5/5</h1>' });
        sqlitesync_DB.transaction(populateDB, errorCB, successCB);
        function populateDB(tx) {
            for (i = 0; i < syncLogs.length; i++) {
                var log = syncLogs[i].split(',');
                tx.executeSql("Insert Into SyncLog([clt_id], [objid], [photoTime], [syncTime]) Values(?, ?, ?, ?)",
                                [log[0], log[1], log[2], log[3]]);
            }
        };
        function errorCB(err) {
            alert("Transaction Error processing SQL: " + err.code + ',' + err.message);
            $.unblockUI();
            showSyncResult();
        }
        function successCB() {
            //alert("Transaction success!");
            nextStep();
        }

        function nextStep() {
            //getTableLocation();
            mySyncEnd();
        }
    }

    function mySyncEnd() {
        //alert('mySyncEnd');
        sqlitesync_DB.transaction(function (tx) {
            //lastUpdateTime = dateTimeToStr(new Date());
            lastUpdateTime = syncTime;
            tx.executeSql("Update [BasicInfo] Set [lastUpdateTime]=?;",
                          [lastUpdateTime], updateBasicInfoSuccess, errorUpdateBasicInfo);

            function errorUpdateBasicInfo(err) {
                $.unblockUI();
                alert('Update BasicInfo error.' + 'Error processing SQL: ' + err.code);
                showSyncResult();
                //console.log("Error processing SQL: " + err.code);
                //navigator.notification.alert('Check Table error.', checkInternet, 'checkTable', 'OK');
            }

            function updateBasicInfoSuccess(tx, results) {
                $.unblockUI();
                $('#divAgt_id').show();
                $("#initialize").show();
                alert('Sync Complete');
                showSyncResult();
                if (myDBSyncOK) myDBSyncOK();
            }
        });
    }

    function showSyncResult() {
        if (upLocSuccess.length > 0 ||
            upPhotoSuccess.length > 0 ||
            dnInsertCount > 0 ||
            dnUpdateCount > 0) {
            var msg = '';

            if (upLocSuccess.length > 0)
                msg = 'Sync - Upload cases: [ ' + upLocSuccess.join() + ' ]';

            if (upPhotoSuccess.length > 0) {
                if (msg.length > 0) msg += '\n';
                msg += 'Sync - Upload photos: [ ' + upPhotoSuccess.join() + ' ]';
            }

            if (dnInsertCount > 0) {
                if (msg.length > 0) msg += '\n';
                msg += 'Sync - Download new case: ' + dnInsertCount;
            }

            if (dnUpdateCount > 0) {
                if (msg.length > 0) msg += '\n';
                msg += 'Sync - Download updated case: ' + dnUpdateCount;
            }

            alert(msg);
        }
        else {
            alert('No Upload');
        }
    }
}