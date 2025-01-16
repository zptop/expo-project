import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, SafeAreaView } from 'react-native';
import request from '../../util/request';
import toast from '../../util/toast';

const VehicleDetail = ({ route }) => {
    const { user_vehicleid } = route.params;
    const [vehicleInfo, setVehicleInfo] = useState(null);
    const [vehicleOptions, setVehicleOptions] = useState({});
    const [displayTexts, setDisplayTexts] = useState({});

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
                const data = res.data;
                data.settleMethod = {
                    1: '按个人结算',
                    2: '按公司结算'
                };
                setVehicleOptions(data);

                // 设置显示文本
                const texts = {
                    vehicleType: data.vehicleType[vehicleInfo.vehicle_type],
                    vehicleLengthType: data.vehicleLengthType[vehicleInfo.vehicle_length_type],
                    licPlateCode: data.licPlateCode[vehicleInfo.lic_plate_code],
                    vehicleClassCode: data.vehicleClassCode[vehicleInfo.vehicle_class_code],
                    vehiclePlateColor: data.vehiclePlateColor[vehicleInfo.vehicle_plate_color],
                    vehicleBrands: data.vehicleBrands[vehicleInfo.vehicle_brands],
                    settleMethod: data.settleMethod[vehicleInfo.settle_method]
                };
                setDisplayTexts(texts);
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
                <View style={styles.infoList}>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>车牌号</Text>
                        <Text style={styles.value}>{vehicleInfo.vehicle_number}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>车型</Text>
                        <Text style={styles.value}>{displayTexts.vehicleType}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>车长</Text>
                        <Text style={styles.value}>{displayTexts.vehicleLengthType}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>锁车状态</Text>
                        <Text style={styles.value}>{vehicleInfo.is_lock_desc}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>核定载质量(KG)</Text>
                        <Text style={styles.value}>{vehicleInfo.vehicle_tonnage}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>牌照类型</Text>
                        <Text style={styles.value}>{displayTexts.licPlateCode}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>车辆分类</Text>
                        <Text style={styles.value}>{displayTexts.vehicleClassCode}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>车辆颜色</Text>
                        <Text style={styles.value}>{displayTexts.vehiclePlateColor}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>业户名称</Text>
                        <Text style={styles.value}>{vehicleInfo.carrier_name}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>车辆品牌</Text>
                        <Text style={styles.value}>{displayTexts.vehicleBrands}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>结算方式</Text>
                        <Text style={styles.value}>{displayTexts.settleMethod}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>结算人姓名</Text>
                        <Text style={styles.value}>{vehicleInfo.settler_name}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>结算人手机号</Text>
                        <Text style={styles.value}>{vehicleInfo.settler_mobile}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>结算人银行卡号</Text>
                        <Text style={styles.value}>{vehicleInfo.settler_bank_card}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>结算人开户行</Text>
                        <Text style={styles.value}>{vehicleInfo.settler_bank_name}</Text>
                    </View>
                </View>

                {/* 证件照片 */}
                <View style={styles.imageList}>
                    {/* 车头商业保险单 */}
                    <View style={styles.imageItem}>
                        <Text style={styles.imageLabel}>车头商业保险单</Text>
                        {vehicleInfo.VehiclePolicyDesc?.[0]?.obs_url_text && (
                            <Image
                                source={{ uri: vehicleInfo.VehiclePolicyDesc[0].obs_url_text }}
                                style={styles.image}
                            />
                        )}
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>交强险过期时间</Text>
                        <Text style={styles.value}>{vehicleInfo.compulsory_insurance_exp}</Text>
                    </View>
                    {/* 注册车辆（牵引车）行驶证正页 */}
                    <View style={styles.imageItem}>
                        <Text style={styles.imageLabel}>注册车辆（牵引车）行驶证正页</Text>
                        {vehicleInfo.DrivingLicPicDesc?.[0]?.obs_url_text && (
                            <Image
                                source={{ uri: vehicleInfo.DrivingLicPicDesc[0].obs_url_text }}
                                style={styles.image}
                            />
                        )}
                    </View>

                    {/* 注册车辆（牵引车）行驶证年审页 */}
                    <View style={styles.imageItem}>
                        <Text style={styles.imageLabel}>注册车辆（牵引车）行驶证年审页</Text>
                        {vehicleInfo.DrivingLicSidePicDesc?.[0]?.obs_url_text && (
                            <Image
                                source={{ uri: vehicleInfo.DrivingLicSidePicDesc[0].obs_url_text }}
                                style={styles.image}
                            />
                        )}
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>（牵引车）车辆年检过期日期</Text>
                        <Text style={styles.value}>{vehicleInfo.vehicle_annual_inspect_exp}</Text>
                    </View>
                    {/* 注册车辆（牵引车）营运证正页 */}
                    <View style={styles.imageItem}>
                        <Text style={styles.imageLabel}>注册车辆（牵引车）营运证正页</Text>
                        {vehicleInfo.VechileOperationPicDesc?.[0]?.obs_url_text && (
                            <Image
                                source={{ uri: vehicleInfo.VechileOperationPicDesc[0].obs_url_text }}
                                style={styles.image}
                            />
                        )}
                    </View>

                    {/* 注册车辆（牵引车）营运证年审页 */}
                    <View style={styles.imageItem}>
                        <Text style={styles.imageLabel}>注册车辆（牵引车）营运证年审页</Text>
                        {vehicleInfo.VechileOperationSidePicDesc?.[0]?.obs_url_text && (
                            <Image
                                source={{ uri: vehicleInfo.VechileOperationSidePicDesc[0].obs_url_text }}
                                style={styles.image}
                            />
                        )}
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>道路运输证号（牵引车）营运证</Text>
                        <Text style={styles.value}>{vehicleInfo.road_trans_cert_number}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>（牵引车）营运证年审过期日期</Text>
                        <Text style={styles.value}>{vehicleInfo.vehicle_annual_audit_exp}</Text>
                    </View>
                    {/* 注册车辆（挂车）行驶证正页 */}
                    <View style={styles.imageItem}>
                        <Text style={styles.imageLabel}>注册车辆（挂车）行驶证正页</Text>
                        {vehicleInfo.TrailerDrivingLicPicDesc?.[0]?.obs_url_text && (
                            <Image
                                source={{ uri: vehicleInfo.TrailerDrivingLicPicDesc[0].obs_url_text }}
                                style={styles.image}
                            />
                        )}
                    </View>

                    {/* 注册车辆（挂车）行驶证年审页 */}
                    <View style={styles.imageItem}>
                        <Text style={styles.imageLabel}>注册车辆（挂车）行驶证年审页</Text>
                        {vehicleInfo.TrailerDrivingLicSidePicDesc?.[0]?.obs_url_text && (
                            <Image
                                source={{ uri: vehicleInfo.TrailerDrivingLicSidePicDesc[0].obs_url_text }}
                                style={styles.image}
                            />
                        )}
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>（挂车）车辆年检过期日期</Text>
                        <Text style={styles.value}>{vehicleInfo.trailer_annual_inspect_exp}</Text>
                    </View>
                    {/* 注册车辆（挂车）营运证正页 */}
                    <View style={styles.imageItem}>
                        <Text style={styles.imageLabel}>注册车辆（挂车）营运证正页</Text>
                        {vehicleInfo.TrailerOperationPicDesc?.[0]?.obs_url_text && (
                            <Image
                                source={{ uri: vehicleInfo.TrailerOperationPicDesc[0].obs_url_text }}
                                style={styles.image}
                            />
                        )}
                    </View>

                    {/* 注册车辆（挂车）营运证年审页 */}
                    <View style={styles.imageItem}>
                        <Text style={styles.imageLabel}>注册车辆（挂车）营运证年审页</Text>
                        {vehicleInfo.TrailerOperationSidePicDesc?.[0]?.obs_url_text && (
                            <Image
                                source={{ uri: vehicleInfo.TrailerOperationSidePicDesc[0].obs_url_text }}
                                style={styles.image}
                            />
                        )}
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>（挂车）营运证年审过期日期</Text>
                        <Text style={styles.value}>{vehicleInfo.trailer_annual_audit_exp}</Text>
                    </View>
                    {/* 人车合影照片 */}
                    <View style={styles.imageItem}>
                        <Text style={styles.imageLabel}>人车合影照片</Text>
                        {vehicleInfo.ManVehiclePicDesc?.[0]?.obs_url_text && (
                            <Image
                                source={{ uri: vehicleInfo.ManVehiclePicDesc[0].obs_url_text }}
                                style={styles.image}
                            />
                        )}
                    </View>
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
    infoList: {
        paddingHorizontal: 15,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    value: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        textAlign: 'right',
    },
    imageList: {
        padding: 15,
    },
    imageItem: {
        marginBottom: 15,
    },
    imageLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 4,
    },
});

export default VehicleDetail; 