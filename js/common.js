// for ajax
//var UrlBase = "http://122.147.232.135:83";      // Production
var UrlBase = "http://122.147.232.137:83/unocredit/MokiWCF";      // Integration
var ServiceName = "/MokiService.svc";
//var ajaxTimeout = 5000;     // ajax 5 秒 timeout
var ajaxTimeout = 20000;     // ajax 20 秒 timeout
var Type = "POST";
var Url;
var Data;
var ContentType;
var DataType;
var ProcessData;
// for ajax

var agt_id = '';
var lastUpdateTime = '1900-1-1';
var offLineOK = false;
var enableOfflineMap = false;   // true 顯示離線地圖

var request = {
	QueryString : function(val) { 
		var uri = window.location.search; 
		var re = new RegExp("" +val+ "\=([^\&\?]*)", "ig"); 
		return ((uri.match(re))?(uri.match(re)[0].substr(val.length+1)):null); 
	}, 
	QueryStrings : function() { 
		var uri = window.location.search; 
		var re = /\w*\=([^\&\?]*)/ig; 
		var retval=[]; 
		while ((arr = re.exec(uri)) != null) 
		retval.push(arr[0]); 
		return retval; 
	}, 
	setQuery : function(val1, val2) { 
		var a = this.QueryStrings(); 
		var retval = ""; 
		var seted = false; 
		var re = new RegExp("^" +val1+ "\=([^\&\?]*)$", "ig"); 
		for(var i=0; i<a.length; i++) { 
			if (re.test(a[i])) { 
				seted = true; 
				a[i] = val1 +"="+ val2; 
			} 
		} 
		retval = a.join("&"); 
		return "?" +retval+ (seted ? "" : (retval ? "&" : "") +val1+ "=" +val2); 
	}
}

/*
alert(formatFloat("1109.1893", 2));
第一個參數num是帶有小數的變數，

第二個參數pos是要取小數後的幾位數。


註：

Math.pow(x,y);
x -- 為number型態 
y -- 為number型態

返回值為x的y次方。
如果pow的參數過大而引起浮點溢出，返回Infinity。
*/
function formatFloat(num, pos) {
    var size = Math.pow(10, pos);
    return Math.round(num * size) / size;
}

// Base64 編解碼
var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
//将Ansi编码的字符串进行Base64编码
function encode64(input) {
    var output = "";
    var chr1, chr2, chr3 = "";
    var enc1, enc2, enc3, enc4 = "";
    var i = 0;
    do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2)
				+ keyStr.charAt(enc3) + keyStr.charAt(enc4);
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
    } while (i < input.length);
    return output;
}
//将Base64编码字符串转换成Ansi编码的字符串
function decode64(input) {
    var output = "";
    var chr1, chr2, chr3 = "";
    var enc1, enc2, enc3, enc4 = "";
    var i = 0;

    if (input.length % 4 != 0) {
        return "";
    }
    var base64test = /[^A-Za-z0-9\+\/\=]/g;
    if (base64test.exec(input)) {
        return "";
    }
    do {
        enc1 = keyStr.indexOf(input.charAt(i++));
        enc2 = keyStr.indexOf(input.charAt(i++));
        enc3 = keyStr.indexOf(input.charAt(i++));
        enc4 = keyStr.indexOf(input.charAt(i++));
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);
        if (enc3 != 64) {
            output += String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output += String.fromCharCode(chr3);
        }
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
    } while (i < input.length);
    return output;
}

function utf16to8(str) {
    var out, i, len, c;

    out = "";
    len = str.length;
    for (i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            out += str.charAt(i);
        } else if (c > 0x07FF) {
            out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
            out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
            out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
        } else {
            out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
            out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
        }
    }
    return out;
}

function utf8to16(str) {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = str.length;
    i = 0;
    while (i < len) {
        c = str.charCodeAt(i++);
        switch (c >> 4) {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                // 0xxxxxxx
                out += str.charAt(i - 1);
                break;
            case 12: case 13:
                // 110x xxxx   10xx xxxx
                char2 = str.charCodeAt(i++);
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = str.charCodeAt(i++);
                char3 = str.charCodeAt(i++);
                out += String.fromCharCode(((c & 0x0F) << 12) |
        ((char2 & 0x3F) << 6) |
        ((char3 & 0x3F) << 0));
                break;
        }
    }
    return out;
}

  // 测试代码 开始
  //var de = encode64(utf16to8("123456"));
  //document.writeln(de + "<br>");
  //var ee = utf8to16(decode64(de))
  //document.writeln(ee);
  // 测试代码 结束

// Base64 編解碼

function padLeft(str, lenght){
    if(str.length >= lenght)
        return str;
    else
        return padLeft("0" +str,lenght);
}
function padRight(str, lenght) {
    if (str.length >= lenght)
        return str;
    else
        return padRight(str + "0", lenght);
}
function dateTimeToStr(dateTime) {
    return dateTime.getFullYear() + '-' +
           padLeft((dateTime.getMonth() + 1).toString(), 2) + '-' +
           padLeft(dateTime.getDate().toString(), 2) + ' ' +
           padLeft(dateTime.getHours().toString(), 2) + ':' +
           padLeft(dateTime.getMinutes().toString(), 2) + ':' +
           padLeft(dateTime.getSeconds().toString(), 2);
}
function dateTimeToUTCStr(dateTime) {
    return dateTime.getUTCFullYear() + '-' +
           padLeft((dateTime.getUTCMonth() + 1).toString(), 2) + '-' +
           padLeft(dateTime.getUTCDate().toString(), 2) + ' ' +
           padLeft(dateTime.getUTCHours().toString(), 2) + ':' +
           padLeft(dateTime.getUTCMinutes().toString(), 2) + ':' +
           padLeft(dateTime.getUTCSeconds().toString(), 2);
}

function createDBConnection(){

	var shortName = 'sqliteLocation';
	var version = '1.0';
	var displayName = 'sqliteLocation';
	var maxSize = 5 * 1024 * 1024; // in bytes

	try{
		if (!window.openDatabase) {
			alert('Error creating database.');
			//navigator.notification.alert('Error creating database.', nullAlert, 'openDatabase', 'OK');
		} else {
			return window.openDatabase(shortName, version, displayName, maxSize);
		}
	} catch (e){
		if(e==2){
			alert("Database version mismatch.");
			//navigator.notification.alert("Database version mismatch.", nullAlert, 'openDatabase', 'OK');
		} else {
			alert("EROR: "+e+".");
			//navigator.notification.alert("EROR: " + e + ".", nullAlert, 'openDatabase', 'OK');
		}
		
		return null;
	}
}

function checkConnection() {
	var networkState = navigator.network.connection.type;

	var states = {};
	states[Connection.UNKNOWN]  = 'Unknown connection';
	states[Connection.ETHERNET] = 'Ethernet connection';
	states[Connection.WIFI]     = 'WiFi connection';
	states[Connection.CELL_2G]  = 'Cell 2G connection';
	states[Connection.CELL_3G]  = 'Cell 3G connection';
	states[Connection.CELL_4G]  = 'Cell 4G connection';
	states[Connection.NONE]     = 'No network connection';

	alert('Connection type: ' + states[networkState]);
}
function checkInternet() {
    //alert(navigator.onLine + '\n' + navigator.connection.type);
    if (navigator.onLine) return true; else return false;
    //if (navigator.connection.type == Connection.NONE) return false;
    //else return true;
}

function getPosFromGPS(getGPSOK, getGPSFalse) {
    $.blockUI({ message: '<h1>Get position</h1>' });

    // 只透過手機 GPS 取座標
    navigator.geolocation.getCurrentPosition(onSuccess, onError, { maximumAge: 3000, timeout: 60000, enableHighAccuracy: true });

    // 獲取位置信息成功時調用的回調函數
    function onSuccess(position) {
        //$('#Get_FromGPS').button('enable');
        $.unblockUI();
        if (getGPSOK) getGPSOK(position.coords);
    }

    // onError回調函數接收一個PositionError對象
    function onError(error) {
        //$('#Get_FromGPS').button('enable');

        $.unblockUI();
        //alert('code: ' + error.code + '\n' +
        //'message: ' + error.message + '\n');
        alert(error.message);
        if (getGPSFalse) getGPSFalse();
    }
}

var checkTable = "'Agent', 'BasicInfo', 'City', 'District', 'Location', 'photo', 'State', 'SyncLog'";
var tables = 8;
//var checkTable = 'Users';
function checkOfflineDB(offlineDBOK, offlineDBFalse) {
    //sqlitesync_DB = createDBConnection();
    //sqlitesync_DB.transaction(function(tx){tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='" + checkTable + "';", [], querySuccess, errorCheck);});
    sqlitesync_DB.transaction(
        function (tx) {
            tx.executeSql("SELECT [name] FROM [sqlite_master] WHERE [type]='table' AND [name] in (" + checkTable + ");", [], querySuccess, errorCheck);

            function errorCheck(err) {
                alert('Check Table error.' + 'Error processing SQL: ' + err.code);
                //console.log("Error processing SQL: " + err.code);
                //navigator.notification.alert('Check Table error.', checkInternet, 'checkTable', 'OK');
                offLineOK = false;

                if (offlineDBFalse) offlineDBFalse();
                //checkOfflineFalse();
            }
            function querySuccess(tx, results) {
                //alert('Check Table success.');
                if (results.rows.length != tables) {
                    // 若 Table store 不存在
                    //navigator.notification.alert('Table store not exist.', nullAlert, 'Check Table', 'OK');
                    //alert('Please Goto Data Manager to initialize and sync');
                    //console.log('Table ' + checkTable + ' not exist.\nPlease Goto Data Manager to initialize and sync');
                    offLineOK = false;

                    if (offlineDBFalse) offlineDBFalse();
                    //checkOfflineFalse();
                }
                else {
                    offLineOK = true;

                    if (offlineDBOK) offlineDBOK();
                    //checkOfflineOK();
                }
            }
        });
}

function getAgt_Id(getAgt_IdOK) {
    //console.log("getAgt_Id");
    sqlitesync_DB.transaction(function (tx) {
        tx.executeSql("Select [agt_id] From [BasicInfo];",
                      [], getAgt_IdSuccess, errorGetAgt_Id);

        function errorGetAgt_Id(err) {
            alert('Get agt_id error.' + 'Error processing SQL: ' + err.code);
            //console.log("Error processing SQL: " + err.code);
            //navigator.notification.alert('Check Table error.', checkInternet, 'checkTable', 'OK');
        }
        function getAgt_IdSuccess(tx, results) {
            if (results.rows.length > 0) {
                //console.log("Select agt_id success");
                agt_id = results.rows.item(0).agt_id;
                if (getAgt_IdOK) getAgt_IdOK();
            }
        }
    });
}

// 把 agt_id 的值寫回 DB
function setAgt_Id(setAgt_IdOK) {
    //console.log("setAgt_Id");
    sqlitesync_DB.transaction(function (tx) {
        tx.executeSql("Delete From [SyncLog];");
        tx.executeSql("Update [BasicInfo] set [agt_id]=?, [lastUpdateTime]=?;",
                      [agt_id, '1900-1-1'], setAgt_IdSuccess, errorSetAgt_Id);

        function errorSetAgt_Id(err) {
            alert('Set agt_id error.' + 'Error processing SQL: ' + err.code);
            //console.log("Error processing SQL: " + err.code);
            //navigator.notification.alert('Check Table error.', checkInternet, 'checkTable', 'OK');
        }
        function setAgt_IdSuccess(tx, results) {
            //console.log("Set agt_id success");
            //alert("Set agt_id (" + agt_id + ") success");
            if (setAgt_IdOK) setAgt_IdOK();
        }
    });
}

function AjaxError(xhr, ajaxOptions, thrownError) {
	$.unblockUI();
	//$("body").append(xhr.status);
	//$("body").append(xhr.responseText);

	alert('Unable to connect to server. Please contact getchee customer service line.');

    //if (ajaxOptions == 'timeout')
    //    alert('Unable to connect to server. Please contact getchee customer service line.');
    //else
    //    alert(xhr.status + '\n' + xhr.responseText + '\n' + ajaxOptions + '\n' + thrownError);
}

function nullAlert()
{
}