import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const AMapView = forwardRef(({ 
  style, 
  markers = [], 
  onMapReady,
  showsUserLocation = true,
  showsCompass = true,
  showsScale = true,
  initialRegion
}, ref) => {
  const webViewRef = useRef(null);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration) => {
      if (webViewRef.current) {
        const script = `
          map.setZoomAndCenter(
            ${12},
            [${region.longitude}, ${region.latitude}],
            false,
            ${duration}
          );
        `;
        webViewRef.current.injectJavaScript(script);
      }
    }
  }));

  // 生成地图HTML
  const getMapHTML = () => {
    const markersStr = JSON.stringify(markers);
    const initialRegionStr = JSON.stringify(initialRegion);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="initial-scale=1.0, user-scalable=no, width=device-width">
        <style>
          html, body, #container {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }
          .amap-marker-label {
            border: none;
            background-color: transparent;
          }
          .driver-info {
            padding: 5px 10px;
            background-color: #1892e5;
            color: white;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            position: relative;
          }
          .driver-info::after {
            content: '';
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            border-width: 6px 6px 0;
            border-style: solid;
            border-color: #1892e5 transparent transparent;
          }
          .marker-icon {
            width: 25px;
            height: 34px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .marker-icon::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
          }
          .start-icon::before {
            background-image: url(https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png);
          }
          .end-icon::before {
            background-image: url(https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png);
          }
          .marker-text {
            color: #fff;
            font-size: 12px;
            font-weight: bold;
            position: relative;
            z-index: 1;
            margin-top: -10px;
          }
        </style>
        <script type="text/javascript">
          window._AMapSecurityConfig = {
            securityJsCode: '7c0a7f4c5c1c5c1c5c1c5c1c5c1c5c1c'
          }
        </script>
        <script type="text/javascript" src="https://webapi.amap.com/maps?v=2.0&key=218cfd67a9c19db9a4588d5b47d5e1df&plugin=AMap.Scale,AMap.ToolBar,AMap.Driving"></script>
      </head>
      <body>
        <div id="container"></div>
        <script>
          // 创建地图实例
          var map = new AMap.Map('container', {
            zoom: 12,
            center: [${initialRegion.longitude}, ${initialRegion.latitude}],
            showIndoorMap: false,
            resizeEnable: true
          });

          // 添加控件
          ${showsCompass ? 'map.addControl(new AMap.Scale());' : ''}
          ${showsScale ? 'map.addControl(new AMap.ToolBar());' : ''}

          // 添加标记点和规划路线
          var markers = ${markersStr};
          var startMarker, endMarker, driverMarker;
          var startPoint, endPoint;
          
          markers.forEach(function(markerData) {
            if (markerData.type === 'start') {
              startPoint = [markerData.coordinate.longitude, markerData.coordinate.latitude];
              startMarker = new AMap.Marker({
                position: startPoint,
                title: markerData.title,
                content: '<div class="marker-icon start-icon"><span class="marker-text">起</span></div>',
                offset: new AMap.Pixel(-12, -34),
                map: map
              });
            } else if (markerData.type === 'end') {
              endPoint = [markerData.coordinate.longitude, markerData.coordinate.latitude];
              endMarker = new AMap.Marker({
                position: endPoint,
                title: markerData.title,
                content: '<div class="marker-icon end-icon"><span class="marker-text">终</span></div>',
                offset: new AMap.Pixel(-12, -34),
                map: map
              });
            } else if (markerData.type === 'driver') {
              driverMarker = new AMap.Marker({
                position: [markerData.coordinate.longitude, markerData.coordinate.latitude],
                title: markerData.title,
                offset: new AMap.Pixel(-12, -34),
                label: {
                  content: '<div class="driver-info">我在这里</div>',
                  direction: 'top'
                },
                map: map
              });
            }
          });

          // 如果有起点和终点，规划路线
          if (startPoint && endPoint) {
            // 使用Web API获取路线数据
            var url = 'https://restapi.amap.com/v3/direction/driving?' + 
              'key=218cfd67a9c19db9a4588d5b47d5e1df' +
              '&origin=' + startPoint.join(',') +
              '&destination=' + endPoint.join(',') +
              '&extensions=all' +
              '&strategy=2' + // 最快路线
              '&output=json';

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function() {
              if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                  var result = JSON.parse(xhr.responseText);
                  if (result.status === '1' && result.route && result.route.paths && result.route.paths.length > 0) {
                    var path = [];
                    result.route.paths[0].steps.forEach(function(step) {
                      var points = step.polyline.split(';').map(function(point) {
                        var [lng, lat] = point.split(',').map(Number);
                        return [lng, lat];
                      });
                      path = path.concat(points);
                    });

                    // 绘制路线
                    var polyline = new AMap.Polyline({
                      path: path,
                      strokeColor: "#1892e5",
                      strokeWeight: 6,
                      strokeStyle: "solid",
                      lineJoin: 'round',
                      lineCap: 'round',
                      showDir: true,
                      map: map
                    });

                    // 自适应显示
                    map.setFitView([startMarker, endMarker]);
                  } else {
                    console.error('获取路线失败:', result);
                  }
                } else {
                  console.error('请求路线失败:', xhr.status);
                }
              }
            };
            xhr.send();
          }

          // 定位
          if (${showsUserLocation}) {
            AMap.plugin('AMap.Geolocation', function() {
              var geolocation = new AMap.Geolocation({
                enableHighAccuracy: true,
                timeout: 10000,
                buttonPosition: 'RB',
                buttonOffset: new AMap.Pixel(10, 20),
                zoomToAccuracy: true
              });
              map.addControl(geolocation);
              geolocation.getCurrentPosition();
            });
          }

          // 地图加载完成回调
          map.on('complete', function() {
            window.ReactNativeWebView.postMessage('mapReady');
          });
        </script>
      </body>
      </html>
    `;
  };

  const handleMessage = (event) => {
    if (event.nativeEvent.data === 'mapReady' && onMapReady) {
      onMapReady();
    }
  };

  return (
    <View style={style}>
      <WebView
        ref={webViewRef}
        source={{ html: getMapHTML() }}
        style={{ flex: 1 }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        bounces={false}
        androidLayerType={Platform.select({
          android: 'hardware',
          default: undefined
        })}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error: ', nativeEvent);
        }}
      />
    </View>
  );
});

export default AMapView; 