import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Dimensions, Alert, SafeAreaView } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import request from '../../../util/request';
import toast from '../../../util/toast';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function WaybillDetail({ route, navigation }) {
    const { waybill_id, action_driver_evaluate } = route.params;
    const [waybillInfo, setWaybillInfo] = useState(null);
    const [reportEventListCount, setReportEventListCount] = useState(0);
    const [region, setRegion] = useState({
        latitude: 39.908822999999984,
        longitude: 116.39747,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [markers, setMarkers] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [polylineCoords, setPolylineCoords] = useState([]);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const mapRef = useRef(null);

    // 检查位置权限
    const checkLocationPermission = async () => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                if (newStatus !== 'granted') {
                    Alert.alert(
                        '需要位置权限',
                        '需要获取您的位置信息才能继续操作，请允许获取位置权限。',
                        [
                            { text: '取消', style: 'cancel' },
                            { text: '设置', onPress: () => Linking.openSettings() }
                        ]
                    );
                    return false;
                }
            }

            // 检查 GPS 是否开启
            const enabled = await Location.hasServicesEnabledAsync();
            if (!enabled) {
                Alert.alert(
                    '提示',
                    '请开启GPS定位后重试',
                    [{ text: '确定' }]
                );
                return false;
            }

            return true;
        } catch (error) {
            console.error('检查位置权限失败:', error);
            return false;
        }
    };

    // 获取当前位置
    const getCurrentLocation = async () => {
        try {
            const hasPermission = await checkLocationPermission();
            if (!hasPermission) return;

            toast.show('正在获取位置信息...', -1);
            
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });

            if (!location?.coords) {
                toast.show('无法获取准确的位置信息，请稍后重试');
                return;
            }

            toast.close();
            setCurrentLocation(location.coords);
            return location.coords;
        } catch (error) {
            toast.close();
            toast.show('获取位置信息失败，请检查GPS是否开启');
            return null;
        }
    };

    // 获取运单详情
    const getWaybillInfo = async () => {
        try {
            const res = await request.get('/app_driver/waybill/getWaybillInfo', {
                waybill_id
            }, true);
            if (res.code === 0 && res.data) {
                setWaybillInfo(res.data);

                // 获取当前位置并更新地图
                const driverLocation = await getCurrentLocation();
                updateMapMarkersAndRoute(res.data, driverLocation);
            }
        } catch (error) {
            toast.show('获取运单详情失败');
        }
    };

    // 获取异常上报数量
    const getReportEventListCount = async () => {
        try {
            const res = await request.get('/app_driver/waybill/reportEventList', {
                page: 1,
                pageSize: 1000,
                waybill_id
            }, true);
            if (res.code === 0) {
                setReportEventListCount(res.data.list?.length || 0);
            }
        } catch (error) {
            console.error('获取异常上报数量失败:', error);
        }
    };

    // 修改路线规划函数
    const getRoutePlan = async (fromLat, fromLng, toLat, toLng) => {
        try {
            // 使用高德地图 Web 服务 API 的驾车路线规划接口
            const url = `https://restapi.amap.com/v3/direction/driving?` +
                `key=218cfd67a9c19db9a4588d5b47d5e1df` +
                `&origin=${fromLng},${fromLat}` +  // 起点坐标，格式为：经度,纬度
                `&destination=${toLng},${toLat}` + // 终点坐标，格式为：经度,纬度
                `&output=json` +
                `&extensions=base`;

            console.log('路线规划请求URL:', url);

            const response = await fetch(url);
            const result = await response.json();

            if (result.status === '1' && result.route?.paths?.[0]?.steps) {
                // 解析路线数据
                const steps = result.route.paths[0].steps;
                let allPoints = [];

                // 解析每一步的坐标点
                steps.forEach(step => {
                    if (step.polyline) {
                        const pointsArr = step.polyline.split(';');
                        const points = pointsArr.map(point => {
                            const [lng, lat] = point.split(',').map(Number);
                            return {
                                latitude: lat,
                                longitude: lng
                            };
                        });
                        allPoints = [...allPoints, ...points];
                    }
                });

                return allPoints;
            } else {
                console.error('路线规划失败:', result);
                // 如果失败，返回起点终点直线
                return [
                    { latitude: fromLat, longitude: fromLng },
                    { latitude: toLat, longitude: toLng }
                ];
            }
        } catch (error) {
            console.error('获取路线规划异常:', error);
            // 发生错误时，返回起点终点直线
            return [
                { latitude: fromLat, longitude: fromLng },
                { latitude: toLat, longitude: toLng }
            ];
        }
    };

    // 修改更新地图标记和路线的函数
    const updateMapMarkersAndRoute = async (waybillData, driverLocation) => {
        if (!waybillData) return;
        
        const { from_lat, from_lng, to_lat, to_lng } = waybillData;
        
        // 确保坐标是数字类型且有效
        const fromLat = parseFloat(from_lat) || 39.908822999999984;
        const fromLng = parseFloat(from_lng) || 116.39747;
        const toLat = parseFloat(to_lat) || fromLat;
        const toLng = parseFloat(to_lng) || fromLng;
        
        console.log('起点坐标:', fromLat, fromLng);
        console.log('终点坐标:', toLat, toLng);
        
        // 获取规划路线
        const routePoints = await getRoutePlan(fromLat, fromLng, toLat, toLng);
        
        // 设置标记点
        const newMarkers = [
            {
                id: 'start',
                coordinate: {
                    latitude: fromLat,
                    longitude: fromLng
                },
                title: '提货地',
                description: waybillData.from_code_text || '',
                type: 'start'
            },
            {
                id: 'end',
                coordinate: {
                    latitude: toLat,
                    longitude: toLng
                },
                title: '目的地',
                description: waybillData.to_code_text || '',
                type: 'end'
            }
        ];
        
        // 如果有司机位置，添加司机标记
        if (driverLocation?.latitude && driverLocation?.longitude) {
            newMarkers.push({
                id: 'driver',
                coordinate: {
                    latitude: driverLocation.latitude,
                    longitude: driverLocation.longitude
                },
                title: '当前位置',
                type: 'driver'
            });
        }
        
        setMarkers(newMarkers);
        
        // 设置路线坐标点
        setRouteCoordinates(routePoints);
        
        // 调整地图视野以包含所有点
        const points = routePoints || [];
        if (points.length > 0) {
            const lats = points.map(coord => coord.latitude);
            const lngs = points.map(coord => coord.longitude);
            
            setRegion({
                latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
                longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
                latitudeDelta: Math.max((Math.max(...lats) - Math.min(...lats)) * 1.5, 0.0922),
                longitudeDelta: Math.max((Math.max(...lngs) - Math.min(...lngs)) * 1.5, 0.0421),
            });
        }
    };

    useEffect(() => {
        getWaybillInfo();
        getReportEventListCount();
    }, []);

    if (!waybillInfo) return null;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollContent}>
                {/* 地图组件 */}
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        region={region}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                        showsCompass={true}
                        showsScale={true}
                        onRegionChangeComplete={setRegion}
                    >
                        {/* 标记点 */}
                        {markers.map(marker => (
                            <Marker
                                key={marker.id}
                                coordinate={marker.coordinate}
                                title={marker.title}
                                description={marker.description}
                            >
                                <View style={styles.markerContainer}>
                                    <Image
                                        source={
                                            marker.type === 'start' ?
                                                require('../../../assets/shensy_driver_xcx_images/start-add.png') :
                                                marker.type === 'end' ?
                                                    require('../../../assets/shensy_driver_xcx_images/end-add.png') :
                                                    require('../../../assets/shensy_driver_xcx_images/driver-location.png')
                                        }
                                        style={[
                                            styles.markerImage,
                                            marker.type === 'driver' && styles.driverMarker
                                        ]}
                                        resizeMode="contain"
                                    />
                                </View>
                            </Marker>
                        ))}
                        
                        {/* 路线 */}
                        {routeCoordinates.length > 0 && (
                            <Polyline
                                coordinates={routeCoordinates}
                                strokeWidth={4}
                                strokeColor="#0066FF"
                            />
                        )}
                    </MapView>
                </View>

                {/* 提货地 */}
                <View style={styles.section}>
                    <View style={styles.locationContainer}>
                        <View style={styles.iconContainer}>
                            <Image
                                source={require('../../../assets/shensy_driver_xcx_images/start-add.png')}
                                style={styles.locationIcon}
                            />
                        </View>
                        <View style={styles.locationContent}>
                            <View style={styles.locationInfo}>
                                <Text style={styles.locationTitle}>提货地</Text>
                                <Text style={styles.locationTime}>
                                    {waybillInfo.dispatch_vehicle_time} 装货
                                </Text>
                            </View>
                            <Text style={styles.address}>{waybillInfo.from_code_text}</Text>
                        </View>
                    </View>
                </View>

                {/* 目的地 */}
                <View style={styles.section}>
                    <View style={styles.locationContainer}>
                        <View style={styles.iconContainer}>
                            <Image
                                source={require('../../../assets/shensy_driver_xcx_images/end-add.png')}
                                style={styles.locationIcon}
                            />
                        </View>
                        <View style={styles.locationContent}>
                            <View style={styles.locationInfo}>
                                <Text style={styles.locationTitle}>目的地</Text>
                                <Text style={styles.locationTime}>
                                    预计{waybillInfo.distance_text || '-'}公里
                                </Text>
                            </View>
                            <Text style={styles.address}>{waybillInfo.to_code_text}</Text>
                        </View>
                    </View>
                </View>

                {/* 货物信息 */}
                <View style={[styles.section, { flexDirection: 'row', alignItems: 'center' }]}>
                    <Text style={styles.sectionTitle}>货物信息</Text>
                    <View style={styles.infoGrid}>
                        <View style={[styles.infoItem, { flexDirection: 'column' }]}>
                            <Image
                                source={require('../../../assets/shensy_driver_xcx_images/d-1.png')}
                                style={[styles.infoIcon, { marginBottom: 10 }]}
                            />
                            <Text style={styles.infoText}>{waybillInfo.goods_name}</Text>
                        </View>
                        <View style={[styles.infoItem, { flexDirection: 'column' }]}>
                            <Image
                                source={require('../../../assets/shensy_driver_xcx_images/d-2.png')}
                                style={[styles.infoIcon, { marginBottom: 10 }]}
                            />
                            <Text style={styles.infoText}>{waybillInfo.goods_weight || '--'}吨</Text>
                        </View>
                        <View style={[styles.infoItem, { flexDirection: 'column' }]}>
                            <Image
                                source={require('../../../assets/shensy_driver_xcx_images/d-3.png')}
                                style={[styles.infoIcon, { marginBottom: 10 }]}
                            />
                            <Text style={styles.infoText}>{waybillInfo.goods_volume || '--'}方</Text>
                        </View>
                    </View>
                </View>

                {/* 车辆信息 */}
                <View style={[styles.section, { flexDirection: 'row', alignItems: 'center' }]}>
                    <Text style={styles.sectionTitle}>车辆信息</Text>
                    <View style={styles.infoGrid}>
                        <View style={[styles.infoItem, { flexDirection: 'column' }]}>
                            <Image
                                source={require('../../../assets/shensy_driver_xcx_images/d-4.png')}
                                style={[styles.infoIcon, { marginBottom: 10 }]}
                            />
                            <Text style={styles.infoText}>一装一卸</Text>
                        </View>
                        <View style={[styles.infoItem, { flexDirection: 'column' }]}>
                            <Image
                                source={require('../../../assets/shensy_driver_xcx_images/d-5.png')}
                                style={[styles.infoIcon, { marginBottom: 10 }]}
                            />
                            <Text style={styles.infoText}>{waybillInfo.vehicle_length_type_text || '--'}</Text>
                        </View>
                        <View style={[styles.infoItem, { flexDirection: 'column' }]}>
                            <Image
                                source={require('../../../assets/shensy_driver_xcx_images/d-6.png')}
                                style={[styles.infoIcon, { marginBottom: 10 }]}
                            />
                            <Text style={styles.infoText}>{waybillInfo.vehicle_type_text}</Text>
                        </View>
                    </View>
                </View>

                {/* 运单号 */}
                <View style={[styles.section, styles.specialSection]}>
                    <View style={styles.row}>
                        <Image
                            source={require('../../../assets/shensy_driver_xcx_images/d-13.png')}
                            style={styles.rowIcon}
                        />
                        <Text style={styles.rowLabel}>运单号</Text>
                    </View>
                    <Text style={styles.rowValue}>{waybillInfo.waybill_no}</Text>
                </View>

                {/* 司机信息 */}
                <View style={[styles.section, styles.driverSection]}>
                    <View style={styles.driverInfo}>
                        <View style={styles.driverAvatar}>
                            <Text style={styles.driverAvatarText}>{waybillInfo.shipper_name.charAt(0)}</Text>
                        </View>
                        <View style={styles.driverDetail}>
                            <Text style={styles.driverName}>{waybillInfo.shipper_name}</Text>
                            <View style={styles.driverTags}>
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>实名认证</Text>
                                </View>
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>公司认证</Text>
                                </View>
                            </View>
                            <Text style={styles.driverCompany}>发货{waybillInfo.total_staff_waybill}条</Text>
                        </View>
                        <View style={styles.driverRating}>
                            <View style={styles.ratingWrapper}>
                                <Image
                                    source={require('../../../assets/shensy_driver_xcx_images/d-14.png')}
                                    style={styles.starIcon}
                                />
                                <Text style={styles.ratingText}>5</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.companyRow}>
                        <Image
                            source={require('../../../assets/shensy_driver_xcx_images/d-7.png')}
                            style={styles.companyIcon}
                        />
                        <Text style={styles.companyName}>上海中建企业公司</Text>
                    </View>
                    <Text style={styles.companySubName}>青山股份集团有限公司</Text>
                </View>

                {/* 收货人 */}
                <View style={[styles.section, styles.specialSection]}>
                    <View style={styles.row}>
                        <Image
                            source={require('../../../assets/shensy_driver_xcx_images/d-8.png')}
                            style={styles.rowIcon}
                        />
                        <Text style={styles.rowLabel}>收货人</Text>
                    </View>
                    <Text style={styles.rowValue}>{waybillInfo.to_contact_name}</Text>
                </View>

                {/* 收货人电话 */}
                <View style={[styles.section, styles.specialSection]}>
                    <View style={styles.row}>
                        <Image
                            source={require('../../../assets/shensy_driver_xcx_images/d-9.png')}
                            style={styles.rowIcon}
                        />
                        <Text style={styles.rowLabel}>收货人电话</Text>
                    </View>
                    <Text style={styles.rowValue}>{waybillInfo.to_contact_phone}</Text>
                </View>

                {/* 异常上报 */}
                {waybillInfo.action_report_event !== 1 && <TouchableOpacity
                    style={[styles.section, styles.specialSection]}
                    onPress={() => navigation.navigate('ReportEvent', { 
                        waybill_id,
                        flag: 'abnormal'
                    })}
                >
                    <View style={styles.row}>
                        <Image
                            source={require('../../../assets/shensy_driver_xcx_images/d-11.png')}
                            style={styles.rowIcon}
                        />
                        <Text style={styles.rowLabel}>异常上报</Text>
                    </View>
                    <View style={styles.rowRight}>
                        <Text style={styles.rowValue}>{reportEventListCount}</Text>
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={20}
                            color="#999"
                            style={styles.arrowIcon}
                        />
                    </View>
                </TouchableOpacity>}
                {/* 电子合同 */}
                <TouchableOpacity
                    style={[styles.section, styles.specialSection]}
                    onPress={async () => {
                        try {
                            // 获取合同URL
                            const res = await request.get('/app_driver/waybill/getContractUrl', {
                                waybill_no: waybillInfo.waybill_no
                            }, true);

                            if (res.code === 0 && res.data) {
                                // 修改跳转目标为 SignContract
                                if (waybillInfo.contract_type === 1) {
                                    navigation.navigate('SignContract', {
                                        contractUrl: res.data.url
                                    });
                                } else {
                                    navigation.navigate('SignContractImg', { contractUrl: res.data.url });
                                }
                            } else {
                                toast.show(res.msg || '获取合同URL失败');
                            }
                        } catch (error) {
                            toast.show(error.message || '获取合同URL失败');
                        }
                    }}
                >
                    <View style={styles.row}>
                        <Image
                            source={require('../../../assets/shensy_driver_xcx_images/d-11.png')}
                            style={styles.rowIcon}
                        />
                        <Text style={styles.rowLabel}>电子合同</Text>
                    </View>
                    <View style={styles.rowRight}>
                        <Text style={[styles.rowValue, { color: '#7fb337' }]}>{waybillInfo.contract_sign_status_text}</Text>
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={20}
                            color="#999"
                            style={styles.arrowIcon}
                        />
                    </View>
                </TouchableOpacity>
                {/* 备注信息 */}
                <View style={[styles.section, styles.specialSection]}>
                    <View style={styles.row}>
                        <Image
                            source={require('../../../assets/shensy_driver_xcx_images/d-12.png')}
                            style={styles.rowIcon}
                        />
                        <Text style={styles.rowLabel}>备注信息</Text>
                    </View>
                    <Text style={styles.rowValue}>{waybillInfo.remark}</Text>
                </View>
            </ScrollView>

            {/* 底部按钮 */}
            <SafeAreaView style={styles.bottomContainer}>
                <View style={styles.bottomButtons}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => Linking.openURL(`tel:${waybillInfo.shipper_mobile}`)}
                    >
                        <Text style={styles.buttonText}>联系货主</Text>
                    </TouchableOpacity>

                    {action_driver_evaluate > 0 && (
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={() => {
                                if (action_driver_evaluate !== 2) {
                                    navigation.navigate('EvaluateOwner', { waybill_id });
                                }
                            }}
                        >
                            <Text style={styles.primaryButtonText}>评价货主</Text>
                        </TouchableOpacity>
                    )}

                    {(waybillInfo.driver_transport_action === 10 || waybillInfo.driver_transport_action === 20) && (
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={() => navigation.navigate('AgreementDetails', {
                                waybill_id: waybillInfo.waybill_id,
                                waybill_no: waybillInfo.waybill_no,
                                action_driver_notice: waybillInfo.action_driver_notice,
                                from_flag: 'start'
                            })}
                        >
                            <Text style={styles.primaryButtonText}>确认发车</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6f7',
    },
    scrollContent: {
        flex: 1,
        paddingBottom: 15, // 为固定底部按钮留出空间
    },
    mapContainer: {
        width: width,
        height: 300,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    markerContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    markerImage: {
        width: 24,
        height: 24,
    },
    driverMarker: {
        width: 20,
        height: 20,
    },
    section: {
        backgroundColor: '#fff',
        padding: 10,
        marginBottom: 5,
    },
    specialSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 20,
        justifyContent: 'center',
        marginRight: 10,
    },
    locationIcon: {
        width: 20,
        height: 20,
    },
    locationContent: {
        flex: 1,
    },
    locationInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    locationTitle: {
        fontSize: 14,
        color: '#333',
    },
    locationTime: {
        fontSize: 14,
        color: '#666',
    },
    address: {
        fontSize: 14,
        color: '#333',
    },
    area: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#333',
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        flex: 1
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '33.33%',
        marginBottom: 2,
    },
    infoIcon: {
        width: 16,
        height: 16,
        marginRight: 5,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowIcon: {
        width: 16,
        height: 16,
        marginRight: 10,
    },
    rowLabel: {
        fontSize: 14,
        color: '#333',
        marginRight: 10,
    },
    rowValue: {
        fontSize: 14,
        color: '#666',
    },
    bottomContainer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    bottomButtons: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
    },
    button: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        backgroundColor: '#f5f5f5',
        marginHorizontal: 5,
    },
    buttonText: {
        fontSize: 14,
        color: '#666',
    },
    primaryButton: {
        backgroundColor: '#1892e5',
    },
    primaryButtonText: {
        fontSize: 14,
        color: '#fff',
    },
    driverSection: {
        padding: 15,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    driverAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(113,186,54,.2)',
        borderWidth: 1,
        borderColor: '#71ba36',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    driverAvatarText: {
        fontSize: 25,
        color: '#71ba36',
    },
    driverDetail: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
    },
    driverTags: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    tag: {
        backgroundColor: '#dfecce',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 2,
        marginRight: 8,
    },
    tagText: {
        fontSize: 12,
        color: '#86aa53',
    },
    driverCompany: {
        fontSize: 12,
        color: '#666',
    },
    driverRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingWrapper: {
        position: 'relative',
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    starIcon: {
        width: 40,
        height: 40,
        position: 'absolute',
    },
    ratingText: {
        fontSize: 14,
        color: '#FFFFFF',
        zIndex: 1,
    },
    companyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    companyIcon: {
        width: 16,
        height: 16,
        marginRight: 5,
    },
    companyName: {
        fontSize: 14,
        color: '#333',
    },
    companySubName: {
        fontSize: 12,
        color: '#999',
        marginLeft: 20,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    arrowIcon: {
        marginLeft: 5,
    },
}); 