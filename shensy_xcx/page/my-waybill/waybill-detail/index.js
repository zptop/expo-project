import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Dimensions, Alert, SafeAreaView, Platform } from 'react-native';
import AMapView from '../../../components/AMapView';
import request from '../../../util/request';
import toast from '../../../util/toast';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import polyline from '@mapbox/polyline';

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
    const locationUpdateTimer = useRef(null);

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
            
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
                distanceInterval: 10
            });

            if (!location?.coords) {
                return null;
            }

            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            };

            setCurrentLocation(coords);
            
            // 更新司机位置标记
            setMarkers(prev => {
                const markersWithoutDriver = prev.filter(marker => marker.id !== 'driver');
                return [...markersWithoutDriver, {
                    id: 'driver',
                    coordinate: coords,
                    title: '当前位置',
                    type: 'driver'
                }];
            });

            return coords;
        } catch (error) {
            console.error('获取位置信息失败:', error);
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
                const waybillData = res.data;
                
                // 确保坐标是数字类型且有效
                const fromLat = parseFloat(waybillData.from_lat) || 39.908822999999984;
                const fromLng = parseFloat(waybillData.from_lng) || 116.39747;
                const toLat = parseFloat(waybillData.to_lat) || fromLat;
                const toLng = parseFloat(waybillData.to_lng) || fromLng;

                // 先设置初始地图视野为起点和终点的中心
                const initialRegion = {
                    latitude: (fromLat + toLat) / 2,
                    longitude: (fromLng + toLng) / 2,
                    latitudeDelta: Math.abs(toLat - fromLat) * 1.5 || 0.0922,
                    longitudeDelta: Math.abs(toLng - fromLng) * 1.5 || 0.0421,
                };
                setRegion(initialRegion);

                // 设置起点和终点标记
                const initialMarkers = [
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
                setMarkers(initialMarkers);
                setWaybillInfo(waybillData);

                // 获取当前位置并添加到标记中
                getCurrentLocation();
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
    const getRoutePlan = async (fromLat, fromLng, toLat, toLng, retryCount = 3) => {
        try {
            const url = `https://restapi.amap.com/v3/direction/driving?` +
                `key=218cfd67a9c19db9a4588d5b47d5e1df` +
                `&origin=${fromLng},${fromLat}` +
                `&destination=${toLng},${toLat}` +
                `&output=json` +
                `&extensions=base`;

            const response = await fetch(url);
            const result = await response.json();

            if (result.status === '1' && result.route?.paths?.[0]?.steps) {
                const steps = result.route.paths[0].steps;
                let allPoints = [];

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

                // 使用 polyline 编码路线点
                const encodedPolyline = polyline.encode(allPoints.map(point => [point.latitude, point.longitude]));
                
                return allPoints;
            } else {
                if (retryCount > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return getRoutePlan(fromLat, fromLng, toLat, toLng, retryCount - 1);
                }
                return [
                    { latitude: fromLat, longitude: fromLng },
                    { latitude: toLat, longitude: toLng }
                ];
            }
        } catch (error) {
            console.error('路线规划失败:', error);
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return getRoutePlan(fromLat, fromLng, toLat, toLng, retryCount - 1);
            }
            return [
                { latitude: fromLat, longitude: fromLng },
                { latitude: toLat, longitude: toLng }
            ];
        }
    };

    // 添加一个新的函数来更新位置
    const startLocationUpdates = () => {
        // 立即获取一次位置
        getCurrentLocation();
        
        // 每30秒更新一次位置
        locationUpdateTimer.current = setInterval(getCurrentLocation, 30000);
    };

    useEffect(() => {
        getWaybillInfo();
        getReportEventListCount();
        startLocationUpdates();

        // 清理定时器
        return () => {
            if (locationUpdateTimer.current) {
                clearInterval(locationUpdateTimer.current);
            }
        };
    }, []);

    if (!waybillInfo) return null;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollContent}>
                {/* 地图组件 */}
                <View style={styles.mapContainer}>
                    <AMapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={region}
                        markers={markers}
                        showsUserLocation={true}
                        showsCompass={true}
                        showsScale={true}
                        onMapReady={() => {
                            console.log('地图加载完成');
                        }}
                    />
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
    driverLocationTip: {
        position: 'absolute',
        backgroundColor: '#1892e5',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 12,
        top: -36,
        left: -30,
        minWidth: 80,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        whiteSpace: 'nowrap',
    },
    driverLocationTipText: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
    },
    driverLocationTipArrow: {
        position: 'absolute',
        bottom: -6,
        left: '50%',
        marginLeft: -6,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#1892e5',
    },
}); 