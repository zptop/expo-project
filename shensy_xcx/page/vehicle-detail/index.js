import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, SafeAreaView } from 'react-native';
import request from '../../util/request';
import toast from '../../util/toast';

const VehicleDetail = ({ route }) => {
    const { user_vehicleid } = route.params;
    const [vehicleInfo, setVehicleInfo] = useState(null);
    const [vehicleOptions, setVehicleOptions] = useState({});

    // 获取车辆详情
    const getVehicleInfo = async () => {
        try {
            const res = await request.get('/app_driver/vehicle/getVehicleInfo', {
                user_vehicleid
            });

            if (res.code === 0) {
                setVehicleInfo(res.data);
                getVehicleOption();
            } else {
                toast.show(res.msg || '获取车辆信息失败');
            }
        } catch (error) {
            toast.show('获取车辆信息失败');
        }
    };

    // 获取车辆配置选项
    const getVehicleOption = async () => {
        try {
            const res = await request.get('/app_driver/vehicle/getVehicleOption', {
                option_type: 'all'
            });

            if (res.code === 0) {
                setVehicleOptions(res.data);
            }
        } catch (error) {
            toast.show('获取配置失败');
        }
    };

    useEffect(() => {
        getVehicleInfo();
    }, []);

    if (!vehicleInfo) return null;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* 基本信息 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>基本信息</Text>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>车牌号</Text>
                        <Text style={styles.value}>{vehicleInfo.vehicle_number}</Text>
                    </View>
                    {/* ... 其他基本信息项 ... */}
                </View>

                {/* 证件照片 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>证件照片</Text>
                    {/* 渲染所有上传的图片 */}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 15,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        width: 100,
        fontSize: 14,
        color: '#666',
    },
    value: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
});

export default VehicleDetail; 