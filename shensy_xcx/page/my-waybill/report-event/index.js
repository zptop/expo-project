import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView, RefreshControl, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import request from '../../../util/request';
import toast from '../../../util/toast';
import config from '../../../util/config';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ReportEvent({ route, navigation }) {
    const { waybill_id, flag = 'abnormal' } = route.params;  // 默认为异常上报
    const [location, setLocation] = useState(null);
    const [listData, setListData] = useState([]);
    const [reason, setReason] = useState('');
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);

    // 检查位置权限和GPS状态
    const checkLocationPermission = async () => {
        try {
            // 先检查GPS是否开启
            const providerStatus = await Location.getProviderStatusAsync();
            if (!providerStatus.locationServicesEnabled) {
                toast.show('请开启GPS定位服务');
                return false;
            }

            // 再检查位置权限
            let { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                if (newStatus !== 'granted') {
                    toast.show('请允许获取位置权限');
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('检查位置权限失败:', error);
            return false;
        }
    };

    // 获取位置信息
    const getUserLocation = async () => {
        try {
            const hasPermission = await checkLocationPermission();
            if (!hasPermission) {
                return false;
            }

            // 先尝试获取最后已知位置
            let lastLocation = await Location.getLastKnownPositionAsync({
                maxAge: 60000 // 允许使用1分钟内的缓存位置
            });
            
            if (lastLocation) {
                setLocation(lastLocation.coords);
            }

            // 然后获取当前位置
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 15000,
                maxAge: 10000,
                mayShowUserSettingsDialog: true // 允许显示系统设置对话框
            });
            
            if (currentLocation) {
                setLocation(currentLocation.coords);
                return true;
            }
            
            if (!lastLocation) {
                throw new Error('无法获取位置信息');
            }
            
            return true;
        } catch (error) {
            console.error('获取位置失败:', error);
            if (error.code === 'E_LOCATION_SETTINGS_UNSATISFIED') {
                toast.show('请开启GPS定位服务并授予位置权限');
            } else {
                toast.show('获取位置信息失败，请确保GPS已开启');
            }
            return false;
        }
    };

    // 添加日期格式化函数
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // 获取异常上报列表
    const getList = async (pageNum = 1) => {
        try {
            setIsLoading(true);
            // 根据 flag 使用不同的接口
            const url = flag === 'receipt' 
                ? '/app_driver/waybill/receiptList'
                : '/app_driver/waybill/reportEventList';

            const res = await request.get(url, {
                page: pageNum,
                pageSize: 10,
                waybill_id
            }, true);

            if (res.code === 0) {
                const formattedList = res.data.list.map(item => ({
                    ...item,
                    create_time: item.create_time > 0 ? formatDate(item.create_time) : '',
                    // 添加空值检查，如果 create_staff_code 为空则使用默认值
                    head_icon: item.create_staff_code 
                        ? item.create_staff_code.replace(/[^\u4e00-\u9fa5]/g, '').charAt(0) || '未'
                        : '未'
                }));

                if (pageNum === 1) {
                    setListData(formattedList);
                } else {
                    setListData(prev => [...prev, ...formattedList]);
                }
                setHasMore(formattedList.length === 10);
            } else {
                toast.show(res.msg);
            }
        } catch (error) {
            console.error('获取列表失败:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 请求相机权限
    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            toast.show('需要相机权限才能拍照');
            return false;
        }
        return true;
    };

    // 请求相册权限
    const requestMediaLibraryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            toast.show('需要相册权限才能选择图片');
            return false;
        }
        return true;
    };

    // 获取 OSS URL
    const getObsUrlHandle = async (obs_key) => {
        try {
            const res = await request.get('/app_driver/obs/getObsUrl', {
                obs_key
            });
            if (res.code === 0) {
                return res.data.url_key;
            } else {
                throw new Error(res.msg || '获取图片URL失败');
            }
        } catch (error) {
            console.error('获取OSS URL失败:', error);
            throw error;
        }
    };

    // 处理图片上传结果
    const handleImageResult = async (tempFilePath) => {
        try {
            // 获取文件扩展名
            const fileExtension = tempFilePath.substring(tempFilePath.lastIndexOf('.') + 1).toLowerCase();
            
            // 获取 OSS 配置
            const ossConfig = await config.getOssMess(fileExtension);
            if (!ossConfig.isSucc) {
                throw new Error('获取OSS配置失败');
            }

            // 上传文件到 OSS
            return new Promise((resolve, reject) => {
                config.ossUpLoadFileRequest(
                    'image',
                    '上传中...',
                    tempFilePath,
                    {},
                    'upload',
                    (data) => {
                        if (data.statusCode === 204) {
                            if (ossConfig.ossParam?.DirKey) {
                                resolve(ossConfig.ossParam.DirKey);
                            } else {
                                reject(new Error('上传失败：无效的 DirKey'));
                            }
                        } else {
                            reject(new Error(data.msg || '上传失败'));
                        }
                    },
                    (error) => {
                        reject(new Error(error.msg || '上传失败'));
                    }
                );
            }).then(async (dirKey) => {
                // 获取上传后的 URL
                return await getObsUrlHandle(dirKey);
            });

        } catch (error) {
            console.error('处理图片失败:', error);
            throw error;
        }
    };

    // 选择图片
    const pickImage = async (type) => {
        if (uploading) {
            toast.show('正在上传中，请稍候...');
            return;
        }

        if (listData.length >= 10) {
            toast.show(`最多只能上传10个${flag === 'receipt' ? '回单' : '异常信息'}`);
            return;
        }

        // 检查位置信息
        const locationSuccess = await getUserLocation();
        if (!locationSuccess) {
            return;
        }

        try {
            let hasPermission;
            let result;

            const options = {
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            };

            if (type === 'camera') {
                hasPermission = await requestCameraPermission();
                if (!hasPermission) return;

                result = await ImagePicker.launchCameraAsync(options);
            } else {
                hasPermission = await requestMediaLibraryPermission();
                if (!hasPermission) return;

                result = await ImagePicker.launchImageLibraryAsync(options);
            }

            if (!result.canceled && result.assets?.[0]?.uri) {
                const uri = result.assets[0].uri;
                try {
                    setUploading(true);
                    const url_key = await handleImageResult(uri);
                    
                    // 再次检查位置信息
                    if (!location) {
                        // 最后一次尝试获取位置
                        await getUserLocation();
                        if (!location) {
                            toast.show('无法获取位置信息，请确保GPS已开启');
                            return;
                        }
                    }

                    const url = flag === 'receipt' 
                        ? '/app_driver/waybill/addNewReceipt'
                        : '/app_driver/waybill/addReportEvent';

                    const response = await request.post(url, {
                        media_url: url_key,
                        waybill_id,
                        lng: location.longitude,
                        lat: location.latitude,
                        ...(flag === 'abnormal' && { fail_reason: reason })
                    });

                    if (response.code === 0) {
                        toast.show('上传成功');
                        setReason('');
                        setPage(1);
                        getList(1);
                    } else {
                        throw new Error(response.msg || '上传失败');
                    }
                } catch (error) {
                    console.error('上传失败:', error);
                    toast.show(error.message || '上传失败');
                } finally {
                    setUploading(false);
                }
            }
        } catch (error) {
            console.error('选择图片失败:', error);
            toast.show('选择图片失败');
            setUploading(false);
        }
    };

    // 删除图片
    const deleteImage = async (index, id) => {
        try {
            // 根据 flag 使用不同的接口和参数
            const url = flag === 'receipt' 
                ? '/app_driver/waybill/deleteReceipt'
                : '/app_driver/waybill/deleteReportEvent';

            const params = flag === 'receipt' 
                ? { media_id: id, waybill_id }
                : { report_id: id, waybill_id };

            const response = await request.post(url, params);

            if (response.code === 0) {
                toast.show('删除成功');
                setPage(1);
                getList(1);
            } else {
                throw new Error(response.msg || '删除失败');
            }
        } catch (error) {
            console.error('删除失败:', error);
            toast.show(error.message || '删除失败');
        }
    };

    // 下拉刷新
    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        setPage(1);
        await getList(1);
        setRefreshing(false);
    }, []);

    // 上拉加载更多
    const onEndReached = async () => {
        if (!isLoading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            await getList(nextPage);
        }
    };

    // 监听滚动事件
    const handleScroll = (event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 20;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= 
            contentSize.height - paddingToBottom;

        if (isCloseToBottom) {
            onEndReached();
        }
    };

    // 在组件挂载时检查权限
    useEffect(() => {
        (async () => {
            await requestMediaLibraryPermission();
            await requestCameraPermission();
            await getUserLocation(); // 初始化时获取位置
        })();
        getList();

        // 添加位置监听
        const locationSubscription = Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 10000, // 每10秒更新一次
                distanceInterval: 10, // 或移动10米更新一次
            },
            (newLocation) => {
                setLocation(newLocation.coords);
            }
        );

        // 清理函数
        return () => {
            locationSubscription.then(sub => sub.remove());
        };
    }, []);

    // 更新页面标题
    useEffect(() => {
        navigation.setOptions({
            title: flag === 'receipt' ? '回单上传' : '异常上报'
        });
    }, [flag]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#1892e5']}
                        tintColor="#1892e5"
                    />
                }
                onScroll={handleScroll}
                scrollEventThrottle={400}
            >
                {listData.length > 0 ? (
                    // 列表展示部分
                    <>
                        {listData.map((item, index) => (
                            <View key={index} style={styles.listItem}>
                                <View style={styles.itemHeader}>
                                    <View style={styles.avatarContainer}>
                                        <Text style={styles.avatarText}>张</Text>
                                    </View>
                                    <Text style={styles.itemNumber}>{item.id || '456'}</Text>
                                    <TouchableOpacity
                                        style={styles.deleteIcon}
                                        onPress={() => deleteImage(index, item.report_id)}
                                    >
                                        <MaterialCommunityIcons
                                            name="delete"
                                            size={24}
                                            color="#ff4d4f"
                                        />
                                    </TouchableOpacity>
                                </View>
                                <Image
                                    source={{ uri: item.media_url }}
                                    style={styles.itemImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.itemFooter}>
                                    <Text style={styles.itemLabel}>货主：</Text>
                                    <Text style={styles.itemValue}>{item.create_staff_code}</Text>
                                </View>
                                <View style={styles.itemFooter}>
                                    <Text style={styles.itemLabel}>日期：</Text>
                                    <Text style={styles.itemValue}>{item.create_time}</Text>
                                </View>
                            </View>
                        ))}
                        {/* 加载更多提示 */}
                        {isLoading && hasMore && (
                            <View style={styles.loadingMore}>
                                <ActivityIndicator color="#1892e5" />
                                <Text style={styles.loadingText}>加载中...</Text>
                            </View>
                        )}
                        {!hasMore && (
                            <Text style={styles.noMoreText}>没有更多数据了</Text>
                        )}
                    </>
                ) : (
                    // 空数据状态
                    <View style={styles.emptyContainer}>
                        <Image
                            source={require('../../../assets/shensy_driver_xcx_images/no-data-icon-2.png')}
                            style={styles.emptyImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.emptyText}>暂无数据</Text>
                    </View>
                )}
            </ScrollView>

            {/* 底部按钮 */}
            <View style={styles.bottomButtons}>
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickImage('album')}
                >
                    <Text style={styles.buttonText}>相册上传</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.uploadButton, styles.primaryButton]}
                    onPress={() => pickImage('camera')}
                >
                    <Text style={[styles.buttonText, styles.primaryButtonText]}>拍照上传</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6f7',
    },
    scrollView: {
        flex: 1,
    },
    listItem: {
        backgroundColor: '#fff',
        marginBottom: 10,
        padding: 15,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ECF4FB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 16,
        color: '#1892e5',
    },
    itemNumber: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    deleteIcon: {
        padding: 5,
    },
    itemImage: {
        width: '100%',
        height: 200,
        borderRadius: 4,
        marginBottom: 10,
    },
    itemFooter: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    itemLabel: {
        fontSize: 14,
        color: '#666',
        width: 50,
    },
    itemValue: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    bottomButtons: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    uploadButton: {
        flex: 1,
        height: 44,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        marginHorizontal: 5,
    },
    primaryButton: {
        backgroundColor: '#1892e5',
    },
    buttonText: {
        fontSize: 16,
        color: '#666',
    },
    primaryButtonText: {
        color: '#fff',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyImage: {
        width: 200,
        height: 200,
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
    },
    loadingMore: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    noMoreText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#999',
        paddingVertical: 10,
    },
}); 