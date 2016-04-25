$(document).on("pageinit", "#offlineMap", function () {
    $('#map-canvas').css('width', document.documentElement.clientWidth).css('height', document.documentElement.clientHeight).css('overflow', 'hidden');
    $('#mapContent').css('width', document.documentElement.clientWidth).css('height', document.documentElement.clientHeight).css('overflow', 'hidden');
    //alert($('#mapContent').offset().left + ',' + $('#mapContent').offset().top + ',' + $('#mapContent').width() + ',' + $('#mapContent').innerWidth() + ',' + $('#mapContent').outerWidth() + ',' + $('#mapContent').outerWidth(true) + '\n' + $('#mapContent').height() + ',' + $('#mapContent').innerHeight() + ',' + $('#mapContent').outerHeight() + ',' + $('#mapContent').outerHeight(true));
    //alert($('#map-canvas').offset().left + ',' + $('#map-canvas').offset().top + ',' + $('#map-canvas').width() + ',' + $('#map-canvas').innerWidth() + ',' + $('#map-canvas').outerWidth() + ',' + $('#map-canvas').outerWidth(true) + '\n' + $('#map-canvas').height() + ',' + $('#map-canvas').innerHeight() + ',' + $('#map-canvas').outerHeight() + ',' + $('#map-canvas').outerHeight(true));

    //alert('offlineMap');
    offlineMap();   // 必須在 pageinit 初始化 leaflet

    $('#checkCompass').change(function () {
        rotateMap = this.checked;
        monitorCompass(this.checked);
    });

    $('#checkPosition').change(function () {
        //alert('checkPosition change');
        positionMap = this.checked;
        monitorPosition(this.checked);
    });

    $('#magnifier').change(function () {
        if (this.checked) {
            currZoom = magniZoom;
        }
        else {
            currZoom = 1;
        }

        //$('#map-canvas').animate({ scale: currZoom }, 1);
        $('#map-canvas').animate({ scale: this.checked ? magniZoom : 1 }, 1);
    });

    $('#drawPolygon').change(function () {
        if (!rotateMap) {   // 地圖旋轉時不畫
            if (!startPolygon) {    // 開始畫 polygon
                if (map.hasLayer(editPolygon)) {    // 把前一個 polygon 移除
                    var bounds = editPolygon.getBounds();

                    map.removeLayer(editPolygon);   // 移除 polygon
                    editPolygon._showBoundMarkers();    // refresh polygon
                }
                myPolygon = L.polyline([]).addTo(map);

                startPolygon = true;
            }
            else {      // polygon 畫完，把線連起來
                var points = myPolygon.getLatLngs();
                if (points.length > 0) {
                    // 把第一點加入最後，變成 polygon
                    myPolygon.addLatLng(points[0]);

                    // 加入 polygon
                    var latlngs = myPolygon.getLatLngs();
                    map.removeLayer(myPolygon);
                    map.removeLayer(startPolygonMark);
                    editPolygon = L.Polyline.PolylineEditor(latlngs, { maxMarkers: 100, addFirstLastPointEvent: '' }).addTo(map);

                    editPolygon._showBoundMarkers();    // refresh polygon
                }

                startPolygon = false;
            }
        }
    });

    $('#lockMap').change(function () {
        if (this.checked) map.dragging.disable();
        else map.dragging.enable();
    });
});

$(document).on("pageshow", "#offlineMap", function () {
    //alert('pageshow 1');

    //alert('setView');
    map.setView([lat, lon], mapZoom);

    //alert('marker');
    startPolygon = false;
    $('#drawPolygon').prop("checked", startPolygon).checkboxradio("refresh");
    if (map.hasLayer(myPolygon)) map.removeLayer(myPolygon);
    if (map.hasLayer(startPolygonMark)) map.removeLayer(startPolygonMark);
    if (map.hasLayer(editPolygon)) map.removeLayer(editPolygon);   // 移除 polygon

    rotateMap = false;
    $('#checkCompass').prop("checked", rotateMap).checkboxradio("refresh");
    monitorCompass(rotateMap);

    if (map.hasLayer(startMarker)) map.removeLayer(startMarker);
    startMarker = L.marker([lat, lon]).bindLabel(locName + '<br />(' + formatFloat(lat, 6) + ', ' + formatFloat(lon, 6) + '), accuracy: ' + formatFloat(accuracy, 2) + ' m', {
        noHide: true,
        direction: 'auto'
    }).addTo(map);  // 作 Mark 與顯示文字

    if (currMarker) map.removeLayer(currMarker);
    currMarker = L.userMarker([lat, lon]).bindLabel('I am here<br />(' + formatFloat(lat, 6) + ', ' + formatFloat(lon, 6) + '), accuracy: ' + formatFloat(accuracy, 2) + ' m<br />' +
                                                                     'altitude : ' + formatFloat(altitude, 2) + ' m, accuracy : ' + formatFloat(altitudeAccuracy, 2) + ' m', {
                                                                         noHide: true,
                                                                         direction: 'auto'
                                                                     }).addTo(map);
    currMarker.setAccuracy(accuracy);

    //alert('change size');
    map.invalidateSize();

    //alert('set monitor');
    monitorPosition(positionMap);
    monitorCompass(rotateMap);
    //alert('pageshow 2');
});

// option
var rotateMap = false;                               // 地圖是否跟著轉
var positionMap = false;                             // 地圖是否以目前位置為中心
//var storagePath = 'file:///storage/sdcard0/';       // 手機 sd 卡的路徑
var storagePath = 'file:///storage/emulated/legacy/';
var subMapPath = 'mokiMap';                         // 地圖存放在 sd 卡的路徑
var mapURL = 'http://122.147.232.135:83/mokidemo/apk/';     // 地圖下載的網址
var mapFileZip = 'Taipei_2014-04-16_135357.zip';            // 地圖的壓縮檔名
var mapZoom = 17;       // 地圖一開始的 Zoom Level
var mapMaxZoom = 19;    // 地圖最大的 Zoom Level
// option
var magniZoom = 2;      // 放大鏡倍數
var currZoom = 1;       // 現在的放大倍數

// 傳入的參數
var lat;    // = request.QueryString('latitude');
var lon;    // = request.QueryString('longitude');
var altitude;   // 海拔高度 (公尺)
var accuracy;           // 平面誤差 (公尺)
var altitudeAccuracy;   // 高度誤差 (公尺)
var locName;   // = decodeURI(request.QueryString('maptitle'));
// 傳入的參數

var map;
var compassID, positionID;
var startMarker;    // 設定的點
var currMarker;     // 所在位置的點
var circleRadius = 100;     // 圓形半徑
var myCircle;   // 畫圓形範圍

var myPolygon, editPolygon;              // 手劃Polygon範圍
var startPolygon = false;   // 是否開始畫 Polygon
var startPolygonMark;       // Polygon 第一點的 mark

// 設定是否圖隨人轉
function monitorCompass(monitor) {
    var options = {
        frequency: 100
    }; // Update every 3 seconds

    if (monitor) {
        map.dragging.disable();
        map.off('click', onMapClick);

        compassID = navigator.compass.watchHeading(onSuccess, onError, options);
    }
    else if (compassID) {
        map.dragging.enable();
        map.on('click', onMapClick);

        $('#map-canvas').animate({ rotate: '0deg' }, 10);
        navigator.compass.clearWatch(compassID);
    }

    function onSuccess(heading) {
        //var element = document.getElementById('heading');
        //element.innerHTML = 'Heading: ' + heading.magneticHeading;
        $('#heading').html('Heading: ' + formatFloat(heading.magneticHeading, 2));

        //$('#map-canvas').rotate('-' + heading.magneticHeading + 'deg');
        $('#map-canvas').animate({rotate: '-' + heading.magneticHeading + 'deg'}, 10);
    };

    function onError(compassError) {
        alert('Compass error: ' + compassError.code);
    };
}

// 設定隨時定位目前位置
function monitorPosition(monitor) {
    if (positionMap) {
        //positionID = navigator.geolocation.watchPosition(onSuccess, onError, { maximumAge: 100, timeout: 500, enableHighAccuracy: true });

        map.on("locationfound", function (location) {
            if (currMarker) map.removeLayer(currMarker);
            currMarker = L.userMarker(location.latlng).bindLabel('I am here<br />(' + formatFloat(location.latlng.lat, 6) + ', ' + formatFloat(location.latlng.lng, 6) + '),  accuracy: ' + formatFloat(location.accuracy, 2) + ' m<br />' +
                                                                                  'altitude : ' + formatFloat(location.altitude, 2) + ' m,  accuracy : ' + formatFloat(location.altitudeAccuracy, 2) + ' m', {
                                                                                      noHide: true,
                                                                                      direction: 'auto'
                                                                                  }).addTo(map);

            currMarker.setAccuracy(location.accuracy);
            //map.setZoom(mapZoom);
        });
        map.locate({
            watch: true,
            //locate: true,
            setView: true,
            maxZoom: mapMaxZoom,
            timeout: 100,
            enableHighAccuracy: true
        });
    }
    else if (positionID) {
        //navigator.geolocation.clearWatch(positionID);
        map.stopLocate()
    }

    // 獲取位置信息成功時調用的回調函數
//    function onSuccess(position) {
//        //alert('position success');
//        //var element = document.getElementById('heading');
//        //element.innerHTML = 'lat: ' + position.coords.latitude + ',lon: ' + position.coords.longitude;
//        map.setView([position.coords.latitude, position.coords.longitude]);

//        if (currMarker)
//            map.removeLayer(currMarker);

//        var myIcon = L.icon({
//            iconUrl: 'images/marker-icon-2x.png'
//        });

//        //currMarker = L.marker([position.coords.latitude, position.coords.longitude], { icon: myIcon }).addTo(map).bindPopup('I am here').addLayer();  // 作 Mark 與顯示文字
//        currMarker = L.marker([position.coords.latitude, position.coords.longitude], { icon: myIcon }).bindLabel('I am here<br />(' + position.coords.latitude + ', ' + position.coords.longitude + ')', {
//            noHide: true,
//            direction: 'auto'
//        }).addTo(map);  // 作 Mark 與顯示文字

//        // 傳回的 GPS 資訊
//        //element.innerHTML = 'Latitude: '           + position.coords.latitude              + '<br />' +
//        //					'Longitude: '          + position.coords.longitude             + '<br />' +
//        //					'Altitude: '           + position.coords.altitude              + '<br />' +
//        //					'Accuracy: '           + position.coords.accuracy              + '<br />' +
//        //					'Altitude Accuracy: '  + position.coords.altitudeAccuracy      + '<br />' +
//        //					'Heading: '            + position.coords.heading               + '<br />' +
//        //					'Speed: '              + position.coords.speed                 + '<br />' +
//        //					'Timestamp: '          + new Date(position.timestamp)          + '<br />';
//    }

    // onError回調函數接收一個PositionError對象
//    function onError(error) {
//        //alert(error.message);
//    }
}

function testDownload() {
    var fileTransfer = new FileTransfer();

    var url = mapURL + "test.txt";
    var filePath = storagePath + subMapPath + "/test.txt";
    fileTransfer.download(
						url, filePath,
						function (entry) {
						    alert("download complete: " + entry.fullPath);
						}, function (error) {
						    alert("download error" + error.source);
						});
}

// offline Map 初始化
function offlineMap() {
    //console.log('offlineMap 1');
    map = L.map('map-canvas');
//    map = L.map('map-canvas', { center: [lat, lon],
//        zoom: mapZoom
//    });
    //console.log('offlineMap 2');
    //alert(storagePath + subMapPath);

    L.tileLayer(storagePath + subMapPath + '/Google Maps/{z}/{x}/{y}.png', { maxZoom: mapMaxZoom }).addTo(map);

    map.invalidateSize();
    $('#status').text('level: ' + map.getZoom());
    
    //$('#map-canvas').scale(1);

    //console.log('offlineMap 3');
    //alert(lat + ',' + lon);
//    startMarker = L.marker([lat, lon]).bindLabel(locName + '<br />(' + lat + ', ' + lon + ')', {
//        noHide: true,
//        direction: 'auto'
//    }).addTo(map);  // 作 Mark 與顯示文字

    //console.log('offlineMap 4');
    map.on('click', onMapClick);
    map.on('zoomend', onMapZoom);
    map.doubleClickZoom.disable();

    function onMapZoom(e)
    {
        $('#status').text('level: ' + map.getZoom());
    }
}

function onMapClick(e) {
    var bounds = map.getBounds();
    var pixelbounds = map.getPixelBounds();
    var calcxlon = bounds.getWest() + e.containerPoint.x * (bounds.getEast() - bounds.getWest()) / (pixelbounds.max.x - pixelbounds.min.x) / currZoom;
    var calcylat = bounds.getNorth() - e.containerPoint.y * (bounds.getNorth() - bounds.getSouth()) / (pixelbounds.max.y - pixelbounds.min.y) / currZoom;

    //var testmsg = '<br />(' + bounds.getWest() + ',' + bounds.getSouth() + ')(' + (pixelbounds.max.x - pixelbounds.min.x) + ',' + (pixelbounds.max.y - pixelbounds.min.y) + ')<br/>(' + calcxlon + ',' + calcylat + ')(' + e.containerPoint.x + ',' + e.containerPoint.y + ')';
    //$('#status').text();

    if (startPolygon) {     // 在畫 polygon
        if (myPolygon.getLatLngs().length == 0)
            startPolygonMark = L.marker([calcylat, calcxlon], { draggable: false, icon: L.icon({ iconUrl: 'editmarker.png', iconSize: [49, 49], iconAnchor: [25, 25] }) }).addTo(map);

        myPolygon.addLatLng([calcylat, calcxlon]);
    }
    else {      // 在自訂點位
        map.removeLayer(startMarker);
        //startMarker = L.marker([calcylat, calcxlon], { draggable: false }).bindLabel(locName + '<br />(' + calcylat + ', ' + calcxlon + ')<br />' + circleRadius + ' m', {
        startMarker = L.marker([calcylat, calcxlon], { draggable: false }).bindLabel(locName + '<br />(' + formatFloat(calcylat, 6) + ', ' + formatFloat(calcxlon, 6) + ')', {
            noHide: true,
            direction: 'auto'
        }).addTo(map);    // 作 Mark 與顯示文字

        //        if (myCircle != undefined) map.removeLayer(myCircle);
        //        myCircle = L.circle([calcylat, calcxlon], circleRadius, {
        //            color: 'red',
        //            fillColor: '#f03',
        //            fillOpacity: 0.2
        //        }).addTo(map);
    }
}

function onlineMap() {
    var mapOptions = {
        zoom: 18,
        //center: new google.maps.LatLng(-34.397, 150.644),
        //center: new google.maps.LatLng(request.QueryString('latitude'), request.QueryString('longitude')),
        center: new google.maps.LatLng(lat, lon),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map-canvas'),
						mapOptions);

    // 做 mark
    //var companyPos = new google.maps.LatLng(request.QueryString('latitude'), request.QueryString('longitude'));
    var companyPos = new google.maps.LatLng(lat, lon);
    var mapTitle = locName;
    var marker = new google.maps.Marker({
        position: companyPos,
        map: map,
        title: mapTitle
    });

    // 顯示資訊
    var contentString = mapTitle;
    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });
    infowindow.open(map, marker);
    google.maps.event.addListener(marker, 'click', function () {
        infowindow.open(map, marker);
    });
}

function mapDownload() {
    $.blockUI();
    var fileTransfer = new FileTransfer();

    var url = mapURL + mapFileZip;
    var filePath = storagePath + subMapPath + "/" + mapFileZip;

    fileTransfer.onprogress = function (progressEvent) {
        if (progressEvent.lengthComputable) {
            var perc = Math.floor(progressEvent.loaded / progressEvent.total * 100);
            $('#status').text(perc + '% loaded...');
        } else {
            if ($('#status').text() == '') {
                $('#status').text('Loading');
            } else {
                $('#status').append('.');
            }
        }
    };

    fileTransfer.download(
						url, filePath,
						function (entry) {
						    $.unblockUI();
						    $('#status').text('');
						    alert("download complete\n" + entry.fullPath);
						    //deleteOldMap();
						}, function (error) {
						    $.unblockUI();
						    $('#status').text('');
						    alert("download error\n" + error.source);
						});
}

function fileErrorHandler(err) {
    var msg = 'An error occured: ';

    switch (err.code) {
        case FileError.NOT_FOUND_ERR:
            msg += 'File or directory not found';
            break;

        case FileError.NOT_READABLE_ERR:
            msg += 'File or directory not readable';
            break;

        case FileError.PATH_EXISTS_ERR:
            msg += 'File or directory already exists';
            break;

        case FileError.TYPE_MISMATCH_ERR:
            msg += 'Invalid filetype';
            break;

        default:
            msg += 'Unknown Error';
            break;
    };

    console.log(msg);
    $.unblockUI();
    alert(msg);
};

function deleteOldMap() {
    $.blockUI();
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fileErrorHandler);

    //function fail(evt) {
    //	alert("FILE SYSTEM FAILURE\n" + evt.target.error.code);
    //}
    function onFileSystemSuccess(fileSystem) {
        console.log('onFileSystemSuccess');
        fileSystem.root.getDirectory(
							subMapPath + '/Google Maps',
							{ create: false, exclusive: false },
							function (entry) {
							    console.log('before removeRecursively');
							    entry.removeRecursively(function () {
							        console.log("Remove Recursively Succeeded");
							        $.unblockUI();
							        alert('Remove Recursively Succeeded');
							        //unzipMap();
							    }, fileErrorHandler);
							}, fileErrorHandler);
    }
}

function unzipMap() {
    $.blockUI();
    zip.unzip(storagePath + subMapPath + "/" + mapFileZip,
								storagePath + subMapPath + "/",
								function (arg) {
								    $.unblockUI();
								    $('#status').text('');
								    if (arg == 0) {
								        console.log('Zip decompressed successfully');
								        alert('Zip decompressed successfully');
								    }
								    else {
								        console.log('Zip decompressed error');
								        alert('Zip decompressed error');
								    }
								},
								function (progressEvent) {
								    $('#status').text('Unzip map ' + Math.round((progressEvent.loaded / progressEvent.total) * 100) + '%');
								}
					);
}