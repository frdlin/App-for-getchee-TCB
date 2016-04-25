var isOnline;

$(document).on('pageinit', '#aboutPage', function () {
    $(document).on("vclick", "#sync", function (e) {
        myDBSync(myDBSyncOK);
        function myDBSyncOK() {
            //$('#sync').addClass('ui-disabled');
        }
    });
});

// 等待加載PhoneGap
document.addEventListener("deviceready", onDeviceReady, false);
// PhoneGap加載完畢
function onDeviceReady() {
    sqlitesync_DB = createDBConnection();
    $('#sync').addClass('ui-disabled');
    isOnline = checkInternet();

    checkOfflineDB(offlineDBOK, offlineDBFalse);
    function offlineDBOK() {
        getAgt_Id(getAgt_IdOK);
        function getAgt_IdOK() {
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
        //alert('online');
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
        //alert('offLine');
        isOnline = false;
        $('#sync').addClass('ui-disabled');
    }

    document.addEventListener("backbutton", myBack, false);
    function myBack(e) {
        //var page = $.mobile.activePage.attr('id');
        //alert('page: ' + page);
        //if (page == 'selectAddress' ||
        //    page == 'syncLogPage') {
        e.preventDefault();
        //navigator.notification.confirm("Are you sure you want to exit ?", onConfirm, "Confirmation", "Yes,No");
        if (confirm('Are you sure you want to exit ?')) navigator.app.exitApp()
        //}
        //else
        //    window.history.back();

        //            function onConfirm(button) {
        //                if (button == 1) {//If User selected No, then we just do nothing
        //                    navigator.app.exitApp(); // Otherwise we quit the app.
        //                }
        //                else
        //                    return;
        //            }
    }

    getAppVersion(function (version) {
        $('.version').text('V ' + version);
    });
}

var appURL = 'http://122.147.232.137:83/unocredit/apk/';
var appFile = 'moki.apk';

// 先確認是否連上 internet
// 需先檢查是否都已經 sync
// 檢查手機上的 apk 版本是否與 Update Table 上的版本不同
// 下載 apk 並安裝
function appDownload() {
    if (confirm('Do you sure you want to update app ?')) {
        // 先確認是否連上 internet
        // 需先檢查是否都已經 sync
        // 檢查手機上的 apk 版本是否與 Update Table 上的版本不同

        $.blockUI();
        // 下載 apk
        var fileTransfer = new FileTransfer();

        var url = appURL + appFile;
        var filePath = storagePath + subMapPath + "/" + appFile;

        fileTransfer.onprogress = function (progressEvent) {
            if (progressEvent.lengthComputable) {
                //var perc = Math.floor(progressEvent.loaded / progressEvent.total * 100);
                //$.unblockUI();
                //$.blockUI({ message: '<h1>' + perc + '% loaded...</h1>' });

                //$('#progress').text(perc + '% loaded...');
            } else {
                //if ($('#progress').text() == '') {
                //    $('#progress').text('Loading');
                //} else {
                //    $('#progress').append('.');
                //}
            }
        };

        fileTransfer.download(
						url, filePath,
						function (entry) {
						    $.unblockUI();
						    //alert("download complete\n" + entry.fullPath);

						    // 安裝 apk
						    cordova.plugins.fileOpener2.open(
                                filePath,
                                'application/vnd.android.package-archive'
                            );
						}, function (error) {
						    $.unblockUI();
						    alert("download error\n" + error.source);
						});
    }
}
