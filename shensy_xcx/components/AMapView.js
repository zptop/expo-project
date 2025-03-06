import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const AMapView = forwardRef(({ 
  style, 
  markers = [], 
  polyline = [], 
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
    },
    fitToCoordinates: (coordinates, options = {}) => {
      if (webViewRef.current) {
        const points = coordinates.map(coord => [coord.longitude, coord.latitude]);
        const script = `
          map.setFitView(null, false, [50, 50, 50, 50], ${options.animated ? 'true' : 'false'});
        `;
        webViewRef.current.injectJavaScript(script);
      }
    }
  }));

  // 生成地图HTML
  const getMapHTML = () => {
    const markersStr = JSON.stringify(markers);
    const polylineStr = JSON.stringify(polyline);
    const initialRegionStr = JSON.stringify(initialRegion);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
        <style>
          html, body, #container {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }
        </style>
        <script type="text/javascript" src="https://webapi.amap.com/maps?v=2.0&key=218cfd67a9c19db9a4588d5b47d5e1df"></script>
      </head>
      <body>
        <div id="container"></div>
        <script>
          var map = new AMap.Map('container', {
            zoom: 12,
            center: [${initialRegion.longitude}, ${initialRegion.latitude}],
            showIndoorMap: false
          });

          // 添加控件
          ${showsCompass ? 'map.addControl(new AMap.Scale());' : ''}
          ${showsScale ? 'map.addControl(new AMap.ToolBar());' : ''}

          // 添加标记点
          var markers = ${markersStr};
          markers.forEach(function(markerData) {
            var icon;
            if (markerData.type === 'start') {
              icon = 'https://webapi.amap.com/theme/v1.3/markers/n/start.png';
            } else if (markerData.type === 'end') {
              icon = 'https://webapi.amap.com/theme/v1.3/markers/n/end.png';
            } else if (markerData.type === 'driver') {
              icon = 'https://webapi.amap.com/theme/v1.3/markers/n/loc.png';
            }
            
            var marker = new AMap.Marker({
              position: [markerData.coordinate.longitude, markerData.coordinate.latitude],
              title: markerData.title,
              icon: icon,
              map: map
            });

            if (markerData.type === 'driver') {
              var info = new AMap.InfoWindow({
                content: '<div style="padding: 5px; border-radius: 3px; background-color: #1892e5; color: white;">我在这里</div>',
                offset: new AMap.Pixel(0, -30)
              });
              info.open(map, marker.getPosition());
            }
          });

          // 添加路线
          if (${polylineStr}.length > 0) {
            var path = ${polylineStr}.map(function(point) {
              return [point.longitude, point.latitude];
            });
            var polyline = new AMap.Polyline({
              path: path,
              strokeColor: "#0066FF",
              strokeWeight: 4,
              strokeStyle: "solid"
            });
            polyline.setMap(map);

            // 自适应显示
            map.setFitView();
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
      />
    </View>
  );
});

export default AMapView; 