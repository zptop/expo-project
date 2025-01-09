import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Dialog from '../Dialog';
import request from '../../util/request';
import toast from '../../util/toast';
import ImagePicker from '../ImagePicker';

// 定义字段映射
const mapVehicleData = new Map([
    [0, 'vehicle_policy'],
    [1, 'driving_lic_pic'],
    [2, 'driving_lic_side_pic'],
    [3, 'road_trans_cert_pic'],
    [4, 'man_vehicle_pic']
]);

const mapSelectData = new Map([
    ['vehicleType', ['请选择车型', 'vehicleType']],
    ['vehicleLengthType', ['请选择车长', 'vehicleLengthType']],
    ['licPlateCode', ['请选择牌照类型', 'licPlateCode']],
    ['vehicleClassCode', ['请选择车辆分类', 'vehicleClassCode']],
    ['vehiclePlateColor', ['请选择车辆颜色', 'vehiclePlateColor']],
    ['vehicleBrands', ['请选择车辆品牌', 'vehicleBrands']],
    ['settleMethod', ['请选择结算方式', 'settleMethod']],
    ['carrierType', ['请选择业务类型', 'carrierType']],
]);

const AddCommVehicle = ({
    user_vehicleid = '',
    flag = 'addvehicle',
    onSubmit
}) => {
    const [vehicleInfo, setVehicleInfo] = useState({
        vehicle_number: '',          // 车牌号
        vehicle_type: '',           // 车型
        vehicle_length_type: '',    // 车长
        vehicle_laden_weight: '',   // 整备质量
        vehicle_tonnage: '',        // 核定载质量
        lic_plate_code: '',        // 牌照类型
        vehicle_class_code: '',    // 车辆分类
        vehicle_plate_color: '',   // 车辆颜色
        carrier_name: '',         // 业户名称
        vehicle_brands: '',       // 车辆品牌
        settle_method: '',       // 结算方式
        carrier_type: '',       // 业务类型
        vehicle_policy: '',     // 车头商业保险单
        driving_lic_pic: '',    // 行驶证正页
        driving_lic_side_pic: '', // 行驶证副页
        road_trans_cert_pic: '', // 道路运输证
        road_trans_cert_number: '', // 道路运输证号
        man_vehicle_pic: '',    // 人车合照
    });
    const [vehicleOptions, setVehicleOptions] = useState({});
    const [dialogVisible, setDialogVisible] = useState(false);
    const [currentSelectType, setCurrentSelectType] = useState('');
    const [displayTexts, setDisplayTexts] = useState({});

    // 获取车辆基础配置
    const getVehicleOption = async () => {
        try {
            const res = await request.get('/app_driver/vehicle/getVehicleOption', {
                option_type: 'all'
            });

            // 模拟测试数据
            const mockData = {
                carrierType: {
                    1: "个体",
                    2: "企业"
                },
                licPlateCode: {
                    99: "其他号牌",
                    "01": "大型汽车号牌",
                    "02": "小型汽车号牌"
                },
                settleMethod: {
                    1: "按个人结算",
                    2: "按公司结算"
                },
                vehicleBrands: {
                    "01": "北汽威旺",
                    "02": "奔驰",
                    "03": "比亚迪"
                    // ... 其他品牌
                },
                vehicleClassCode: {
                    G01: "普通挂车",
                    G04: "平板挂车",
                    G07: "仓栅式挂车",
                    H01: "普通货车",
                    H02: "厢式货车",
                    H05: "平板货车",
                    H06: "集装箱车",
                    H09: "仓栅式货车",
                    Q00: "牵引车",
                    X91: "车辆运输车"
                },
                vehicleLengthType: {
                    1: "4.2M",
                    2: "5M",
                    3: "6.2M",
                    4: "6.8M",
                    5: "7.2M",
                    6: "7.7M",
                    7: "7.8M",
                    8: "8.2M",
                    9: "8.7M",
                    10: "9.6M",
                    11: "12.5M",
                    12: "13M",
                    13: "16M",
                    14: "17.5M"
                },
                vehiclePlateColor: {
                    1: "蓝色",
                    2: "黄色",
                    3: "黑色",
                    4: "白色",
                    5: "绿色",
                    9: "其他"
                },
                vehicleType: {
                    1: "平板单车",
                    2: "高栏车",
                    3: "厢式单车",
                    4: "高低板",
                    5: "保温冷藏",
                    6: "危险品",
                    7: "平板挂车",
                    8: "厢式挂车",
                    9: "其他"
                }
            };

            // 使用模拟数据或实际接口返回的数据
            res.data.settleMethod = {
                1: '按个人结算',
                2: '按公司结算'
            }
            res.data.carrierType = {
                1: '个体',
                2: '企业'
            }
            const optionsData = res.code === 0 && res.data ? res.data : mockData;
            setVehicleOptions(optionsData);
        } catch (error) {
            toast.show('获取配置失败');
        }
    };

    // 获取车辆信息（编辑模式）
    const getVehicleInfo = async () => {
        try {
            // 先获取车辆信息
            const res = await request.get('/app_driver/vehicle/getVehicleInfo', {
                user_vehicleid  // 编辑模式只传 user_vehicleid
            });

            if (res.code === 0 && res.data) {
                const data = res.data;
                
                // 获取选项配置
                const optionsRes = await request.get('/app_driver/vehicle/getVehicleOption', {
                    option_type: 'all'
                });

                if (optionsRes.code === 0 && optionsRes.data) {
                    // 添加结算方式和业务类型选项
                    optionsRes.data.settleMethod = {
                        1: '按个人结算',
                        2: '按公司结算'
                    };
                    optionsRes.data.carrierType = {
                        1: '个体',
                        2: '企业'
                    };
                    setVehicleOptions(optionsRes.data);

                    // 处理图片数据和其他字段
                    const processedData = {
                        ...data,
                        vehicle_policy: data.VehiclePolicyDesc?.[0]?.obs_url_text || '',
                        driving_lic_pic: data.DrivingLicPicDesc?.[0]?.obs_url_text || '',
                        driving_lic_side_pic: data.DrivingLicSidePicDesc?.[0]?.obs_url_text || '',
                        road_trans_cert_pic: data.RoadTransCertPicDesc?.[0]?.obs_url_text || '',
                        man_vehicle_pic: data.ManVehiclePicDesc?.[0]?.obs_url_text || '',
                        vehicle_type: data.vehicle_type,
                        vehicle_length_type: data.vehicle_length_type,
                        lic_plate_code: data.lic_plate_code,
                        vehicle_class_code: data.vehicle_class_code,
                        vehicle_plate_color: data.vehicle_plate_color,
                        vehicle_brands: data.vehicle_brands,
                        settle_method: data.settle_method,
                        carrier_type: data.carrier_type,
                        vehicle_laden_weight: data.vehicle_laden_weight?.toString() || '',
                        vehicle_tonnage: data.vehicle_tonnage?.toString() || '',
                    };

                    // 更新车辆信息
                    setVehicleInfo(processedData);

                    // 更新显示文本
                    const newDisplayTexts = {
                        vehicleType: optionsRes.data.vehicleType[data.vehicle_type],
                        vehicleLengthType: optionsRes.data.vehicleLengthType[data.vehicle_length_type],
                        licPlateCode: optionsRes.data.licPlateCode[data.lic_plate_code],
                        vehicleClassCode: optionsRes.data.vehicleClassCode[data.vehicle_class_code],
                        vehiclePlateColor: optionsRes.data.vehiclePlateColor[data.vehicle_plate_color],
                        vehicleBrands: optionsRes.data.vehicleBrands[data.vehicle_brands],
                        settleMethod: optionsRes.data.settleMethod[data.settle_method],
                        carrierType: optionsRes.data.carrierType[data.carrier_type],
                    };
                    setDisplayTexts(newDisplayTexts);
                } else {
                    toast.show('获取配置失败');
                }
            } else {
                toast.show(res.msg || '获取车辆信息失败');
            }
        } catch (error) {
            toast.show('获取车辆信息失败');
        }
    };

    // 添加匹配车辆信息方法
    const matchVehicleInfo = async () => {
        if (!vehicleInfo.vehicle_number) {
            toast.show('请输入车牌号');
            return;
        }

        try {
            const res = await request.get('/app_driver/vehicle/getVehicleInfo', {
                vehicle_number: vehicleInfo.vehicle_number  // 匹配时只传 vehicle_number
            });

            if (res.code === 0 && res.data) {
                const data = res.data;
                
                // 处理图片数据和其他字段
                const processedData = {
                    ...data,
                    vehicle_policy: data.VehiclePolicyDesc?.[0]?.obs_url_text || '',
                    driving_lic_pic: data.DrivingLicPicDesc?.[0]?.obs_url_text || '',
                    driving_lic_side_pic: data.DrivingLicSidePicDesc?.[0]?.obs_url_text || '',
                    road_trans_cert_pic: data.RoadTransCertPicDesc?.[0]?.obs_url_text || '',
                    man_vehicle_pic: data.ManVehiclePicDesc?.[0]?.obs_url_text || '',
                    vehicle_type: data.vehicle_type,
                    vehicle_length_type: data.vehicle_length_type,
                    lic_plate_code: data.lic_plate_code,
                    vehicle_class_code: data.vehicle_class_code,
                    vehicle_plate_color: data.vehicle_plate_color,
                    vehicle_brands: data.vehicle_brands,
                    settle_method: data.settle_method,
                    carrier_type: data.carrier_type,
                    vehicle_laden_weight: data.vehicle_laden_weight?.toString() || '',
                    vehicle_tonnage: data.vehicle_tonnage?.toString() || '',
                };

                // 更新车辆信息
                setVehicleInfo(processedData);

                // 更新显示文本
                const newDisplayTexts = {
                    vehicleType: vehicleOptions.vehicleType[data.vehicle_type],
                    vehicleLengthType: vehicleOptions.vehicleLengthType[data.vehicle_length_type],
                    licPlateCode: vehicleOptions.licPlateCode[data.lic_plate_code],
                    vehicleClassCode: vehicleOptions.vehicleClassCode[data.vehicle_class_code],
                    vehiclePlateColor: vehicleOptions.vehiclePlateColor[data.vehicle_plate_color],
                    vehicleBrands: vehicleOptions.vehicleBrands[data.vehicle_brands],
                    settleMethod: vehicleOptions.settleMethod[data.settle_method],
                    carrierType: vehicleOptions.carrierType[data.carrier_type],
                };
                setDisplayTexts(newDisplayTexts);
            } else {
                toast.show(res.msg || '获取车辆信息失败');
            }
        } catch (error) {
            toast.show('获取车辆信息失败');
        }
    };

    useEffect(() => {
        if (user_vehicleid) {
            getVehicleInfo();
        } else {
            getVehicleOption();
        }
    }, []);

    // 处理选择器点击
    const handleSelectClick = (type) => {
        setCurrentSelectType(type);
        setDialogVisible(true);
    };

    // 处理选择器确认
    const handleSelectConfirm = (label, value) => {
        const fieldName = mapSelectData.get(currentSelectType)?.[1];
        if (!fieldName) {
            return;
        }

        setVehicleInfo(prev => ({
            ...prev,
            [fieldName]: value
        }));
        setDisplayTexts(prev => ({
            ...prev,
            [currentSelectType]: label
        }));
        setDialogVisible(false);
    };

    // 渲染选择器选项
    const renderPickerItems = () => {
        if (!currentSelectType || !vehicleOptions) {
            return [];
        }

        const fieldName = mapSelectData.get(currentSelectType)?.[1];
        if (!fieldName || !vehicleOptions[fieldName]) {
            return [];
        }

        return Object.entries(vehicleOptions[fieldName]).map(([key, value]) => ({
            label: value,
            value: key
        }));
    };

    // 渲染选择项
    const renderSelectItem = (title, type, required = true, extraButton = null) => (
        <TouchableOpacity
            style={styles.selectItem}
            onPress={() => handleSelectClick(type)}
        >
            <View style={styles.selectLeft}>
                {required && <Text style={styles.required}>*</Text>}
                <Text style={styles.selectTitle}>{title}</Text>
            </View>
            <View style={styles.selectRight}>
                <View style={styles.selectValueContainer}>
                    <Text style={styles.selectValue}>
                        {displayTexts[type] || `请选择${title}`}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
                </View>
                {extraButton}
            </View>
        </TouchableOpacity>
    );

    // 处理图片上传
    const handleImageUpload = (file, index) => {
        const fieldName = mapVehicleData.get(index);
        if (fieldName) {
            setVehicleInfo(prev => ({
                ...prev,
                [fieldName]: file.obs_url,  // 保存相对路径用于提交
                [`${fieldName}_full`]: file.obs_url_text  // 保存完整路径用于显示
            }));
        }
    };

    // 添加图片删除处理方法
    const handleImageDelete = (index) => {
        const fieldName = mapVehicleData.get(index);
        if (fieldName) {
            setVehicleInfo(prev => ({
                ...prev,
                [fieldName]: ''
            }));
        }
    };

    // 添加表单校验方法
    const validateForm = () => {
        if (!vehicleInfo.vehicle_number) {
            toast.show('请输入车牌号');
            return false;
        }
        if (!vehicleInfo.vehicle_type) {
            toast.show('请选择车型');
            return false;
        }
        if (!vehicleInfo.vehicle_length_type) {
            toast.show('请选择车长');
            return false;
        }
        if (!vehicleInfo.vehicle_laden_weight) {
            toast.show('请输入整备质量');
            return false;
        }
        if (!vehicleInfo.vehicle_tonnage) {
            toast.show('请输入核定载质量');
            return false;
        }
        if (!vehicleInfo.lic_plate_code) {
            toast.show('请选择牌照类型');
            return false;
        }
        if (!vehicleInfo.vehicle_class_code) {
            toast.show('请选择车辆分类');
            return false;
        }
        if (!vehicleInfo.vehicle_plate_color) {
            toast.show('请选择车辆颜色');
            return false;
        }
        if (!vehicleInfo.carrier_name) {
            toast.show('请输入业户名称');
            return false;
        }
        if (!vehicleInfo.settle_method) {
            toast.show('请选择结算方式');
            return false;
        }
        if (!vehicleInfo.road_trans_cert_number) {
            toast.show('请输入道路运输证号');
            return false;
        }
        if (!vehicleInfo.vehicle_policy) {
            toast.show('请上传车头商业保险单');
            return false;
        }
        if (!vehicleInfo.driving_lic_pic) {
            toast.show('请上传行驶证正页');
            return false;
        }
        if (!vehicleInfo.driving_lic_side_pic) {
            toast.show('请上传行驶证副页');
            return false;
        }
        if (!vehicleInfo.road_trans_cert_pic) {
            toast.show('请上传道路运输证');
            return false;
        }
        if (!vehicleInfo.man_vehicle_pic) {
            toast.show('请上传人车合照');
            return false;
        }
        return true;
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* 车牌号 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.inputLabel}>车牌号</Text>
                    </View>
                    <View style={styles.inputRight}>
                        <TextInput
                            style={styles.input}
                            value={vehicleInfo.vehicle_number}
                            onChangeText={text => setVehicleInfo(prev => ({ ...prev, vehicle_number: text }))}
                            placeholder="请输入车牌号"
                        />
                        <TouchableOpacity
                            style={styles.matchButton}
                            onPress={matchVehicleInfo}
                        >
                            <Text style={styles.matchButtonText}>匹配</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 选择项 */}
                {renderSelectItem('车型', 'vehicleType')}
                {renderSelectItem('车长', 'vehicleLengthType')}

                {/* 整备质量 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.inputLabel}>整备质量(KG)</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        value={vehicleInfo.vehicle_laden_weight}
                        onChangeText={text => setVehicleInfo(prev => ({ ...prev, vehicle_laden_weight: text }))}
                        placeholder="请输入整备质量"
                        keyboardType="numeric"
                    />
                </View>

                {/* 核定载质量 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.inputLabel}>核定载质量(KG)</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        value={vehicleInfo.vehicle_tonnage}
                        onChangeText={text => setVehicleInfo(prev => ({ ...prev, vehicle_tonnage: text }))}
                        placeholder="请输入核定载质量"
                        keyboardType="numeric"
                    />
                </View>

                {renderSelectItem('牌照类型', 'licPlateCode')}
                {renderSelectItem('车辆分类', 'vehicleClassCode')}
                {renderSelectItem('车辆颜色', 'vehiclePlateColor')}

                {/* 业户名称 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.inputLabel}>业户名称</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        value={vehicleInfo.carrier_name}
                        onChangeText={text => setVehicleInfo(prev => ({ ...prev, carrier_name: text }))}
                        placeholder="请输入业户名称"
                    />
                </View>

                {renderSelectItem('车辆品牌', 'vehicleBrands', false)}

                {/* 结算方式 */}
                <View style={styles.selectItem}>
                    <View style={styles.selectLeft}>
                        <Text style={styles.selectTitle}>结算方式</Text>
                    </View>
                    <View style={styles.selectRight}>
                        <TouchableOpacity
                            style={styles.selectValueContainer}
                            onPress={() => handleSelectClick('settleMethod')}
                        >
                            <Text style={styles.selectValue}>
                                {displayTexts.settleMethod || '请选择结算方式'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={() => {
                                // 处理查询按钮点击
                            }}
                        >
                            <Text style={styles.searchButtonText}>查询</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {renderSelectItem('业务类型', 'carrierType', false)}

                {/* 结算人信息 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.inputLabel}>结算人姓名</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        value={vehicleInfo.name}
                        editable={false}
                        placeholder="请选择结算人"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.inputLabel}>结算人手机号</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        value={vehicleInfo.mobile}
                        editable={false}
                        placeholder="请选择结算人"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.inputLabel}>结算人银行卡号</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        value={vehicleInfo.bank_card_no}
                        editable={false}
                        placeholder="请选择结算人"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.inputLabel}>结算人开户行</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        value={vehicleInfo.bank_name}
                        editable={false}
                        placeholder="请选择结算人"
                    />
                </View>

                {/* 道路运输证号 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.inputLabel}>道路运输证号</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        value={vehicleInfo.road_trans_cert_number}
                        onChangeText={text => setVehicleInfo(prev => ({ ...prev, road_trans_cert_number: text }))}
                        placeholder="请输入道路运输证号"
                    />
                </View>

                {/* 图片上传部分 */}
                <View style={styles.uploadGroup}>
                    <View style={styles.uploadLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.uploadTitle}>车头商业保险单</Text>
                    </View>
                    <View style={styles.uploadContent}>
                        <ImagePicker
                            files={vehicleInfo.vehicle_policy ? [{
                                url: vehicleInfo.vehicle_policy
                            }] : []}
                            onUpload={(file) => handleImageUpload(file, 0)}
                            onDelete={() => handleImageDelete(0)}
                            showDelete={!!vehicleInfo.vehicle_policy}
                        />
                        <View style={styles.exampleContainer}>
                            <Image
                                source={{ uri: 'https://test-shensy.ship56.net/shensy_driver_xcx_images/vehicle-f-1.png' }}
                                style={styles.exampleImage}
                            />
                            <View style={styles.exampleLabel}>
                                <Text style={styles.exampleText}>示例</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.uploadGroup}>
                    <View style={styles.uploadLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.uploadTitle}>行驶证正页</Text>
                    </View>
                    <View style={styles.uploadContent}>
                        <ImagePicker
                            files={vehicleInfo.driving_lic_pic ? [{
                                url: vehicleInfo.driving_lic_pic
                            }] : []}
                            onUpload={(file) => handleImageUpload(file, 1)}
                            onDelete={() => handleImageDelete(1)}
                            showDelete={!!vehicleInfo.driving_lic_pic}
                        />
                        <View style={styles.exampleContainer}>
                            <Image
                                source={{ uri: 'https://test-shensy.ship56.net/shensy_driver_xcx_images/vehicle-f-2-1.png' }}
                                style={styles.exampleImage}
                            />
                            <View style={styles.exampleLabel}>
                                <Text style={styles.exampleText}>示例</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.uploadGroup}>
                    <View style={styles.uploadLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.uploadTitle}>行驶证副页</Text>
                    </View>
                    <View style={styles.uploadContent}>
                        <ImagePicker
                            files={vehicleInfo.driving_lic_side_pic ? [{
                                url: vehicleInfo.driving_lic_side_pic
                            }] : []}
                            onUpload={(file) => handleImageUpload(file, 2)}
                            onDelete={() => handleImageDelete(2)}
                            showDelete={!!vehicleInfo.driving_lic_side_pic}
                        />
                        <View style={styles.exampleContainer}>
                            <Image
                                source={{ uri: 'https://test-shensy.ship56.net/shensy_driver_xcx_images/vehicle-f-2-2.png' }}
                                style={styles.exampleImage}
                            />
                            <View style={styles.exampleLabel}>
                                <Text style={styles.exampleText}>示例</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.uploadGroup}>
                    <View style={styles.uploadLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.uploadTitle}>道路运输证</Text>
                    </View>
                    <View style={styles.uploadContent}>
                        <ImagePicker
                            files={vehicleInfo.road_trans_cert_pic ? [{
                                url: vehicleInfo.road_trans_cert_pic
                            }] : []}
                            onUpload={(file) => handleImageUpload(file, 3)}
                            onDelete={() => handleImageDelete(3)}
                            showDelete={!!vehicleInfo.road_trans_cert_pic}
                        />
                        <View style={styles.exampleContainer}>
                            <Image
                                source={{ uri: 'https://test-shensy.ship56.net/shensy_driver_xcx_images/vehicle-f-3.png' }}
                                style={styles.exampleImage}
                            />
                            <View style={styles.exampleLabel}>
                                <Text style={styles.exampleText}>示例</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.uploadGroup}>
                    <View style={styles.uploadLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.uploadTitle}>人车合照</Text>
                    </View>
                    <View style={styles.uploadContent}>
                        <ImagePicker
                            files={vehicleInfo.man_vehicle_pic ? [{
                                url: vehicleInfo.man_vehicle_pic
                            }] : []}
                            onUpload={(file) => handleImageUpload(file, 4)}
                            onDelete={() => handleImageDelete(4)}
                            showDelete={!!vehicleInfo.man_vehicle_pic}
                        />
                        <View style={styles.exampleContainer}>
                            <Image
                                source={{ uri: 'https://test-shensy.ship56.net/shensy_driver_xcx_images/vehicle-f-4.png' }}
                                style={styles.exampleImage}
                            />
                            <View style={styles.exampleLabel}>
                                <Text style={styles.exampleText}>示例</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 选择器弹窗 */}
                <Dialog
                    visible={dialogVisible}
                    title={mapSelectData.get(currentSelectType)?.[0] || '请选择'}
                    data={renderPickerItems()}
                    onCancel={() => setDialogVisible(false)}
                    onConfirm={(label, value) => handleSelectConfirm(label, value)}
                />
            </ScrollView>

            {/* 提交按钮 */}
            <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                    if (validateForm()) {
                        onSubmit(vehicleInfo);
                    }
                }}
            >
                <Text style={styles.submitButtonText}>提交</Text>
            </TouchableOpacity>
        </View>
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
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    inputLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 120,
    },
    required: {
        color: '#ff4d4f',
        marginRight: 2,
    },
    inputLabel: {
        fontSize: 14,
        color: '#333',
    },
    inputRight: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: 40,
        padding: 0,
        fontSize: 14,
        color: '#333',
        textAlign: 'right',
    },
    matchButton: {
        marginLeft: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#1892e5',
        borderRadius: 4,
    },
    matchButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    selectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    selectLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectTitle: {
        fontSize: 14,
        color: '#333',
    },
    selectRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectValue: {
        fontSize: 14,
        color: '#999',
        marginRight: 5,
    },
    submitButton: {
        margin: 15,
        backgroundColor: '#1892e5',
        borderRadius: 4,
        paddingVertical: 12,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    uploadGroup: {
        padding: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    uploadLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    uploadTitle: {
        fontSize: 14,
        color: '#333',
    },
    uploadContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    exampleContainer: {
        position: 'relative',
        marginLeft: 10,
    },
    exampleImage: {
        width: 73,
        height: 73,
        borderWidth: 1,
        borderColor: '#b2bab4',
        borderRadius: 4,
    },
    exampleLabel: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#b2bab4',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderBottomRightRadius: 10,
    },
    exampleText: {
        color: '#fff',
        fontSize: 11,
    },
    searchButton: {
        marginLeft: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#1892e5',
        borderRadius: 4,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    readOnlyInput: {
        backgroundColor: '#f0f0f0',
    },
    selectValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default AddCommVehicle;
