import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, Modal, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Dialog from '../Dialog';
import request from '../../util/request';
import toast from '../../util/toast';
import ImagePicker from '../ImagePicker';
import DatePicker from '../DatePicker';

// 定义字段映射
const mapVehicleData = new Map([
    [0, 'vehicle_policy'],
    [1, 'driving_lic_pic'],
    [2, 'driving_lic_side_pic'],
    [3, 'vechile_operation_pic'],
    [4, 'vechile_operation_side_pic'],
    [5, 'road_trans_cert_pic'],
    [6, 'trailer_driving_lic_pic'],
    [7, 'trailer_driving_lic_side_pic'],
    [8, 'trailer_operation_pic'],
    [9, 'trailer_operation_side_pic'],
    [10, 'man_vehicle_pic']
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
        driving_lic_pic: '',    // 注册车辆（牵引车）行驶证正页
        driving_lic_side_pic: '', // 注册车辆（牵引车）行驶证年审页
        vehicle_annual_inspect_exp: '', // 注册车辆（牵引车）年检过期日期
        vechile_operation_pic: '', // 注册车辆（牵引车）营运证正页
        vechile_operation_side_pic: '', // 注册车辆（牵引车）营运证副页
        vehicle_annual_audit_exp: '', // 注册车辆（牵引车）年审过期日期
        road_trans_cert_pic: '', // 道路运输证
        road_trans_cert_number: '', // 道路运输证号
        trailer_driving_lic_pic: '',		//挂车行驶证正页
        trailer_driving_lic_side_pic: '',	//挂车行驶证年审页
        trailer_annual_inspect_exp: '', // 挂车年检过期日期
        trailer_operation_pic: '', //挂车营运证正页
        trailer_operation_side_pic: '',//挂车营运证年审页
        trailer_annual_audit_exp: '',  //挂车营运证年审过期日期	
        man_vehicle_pic: '',    // 人车合照
    });
    const [vehicleOptions, setVehicleOptions] = useState({});
    const [dialogVisible, setDialogVisible] = useState(false);
    const [currentSelectType, setCurrentSelectType] = useState('');
    const [displayTexts, setDisplayTexts] = useState({});
    const [settlementVisible, setSettlementVisible] = useState(false); // 结算弹框显示
    const [searchKeyword, setSearchKeyword] = useState(''); // 搜索关键词
    const [settleList, setSettleList] = useState([]); // 结算列表

    // 在组件中定义一个变量来判断是否禁用
    const isDisabled = vehicleInfo.audit_status === 1;

    // 初始化时设置默认值
    useEffect(() => {
        if (!user_vehicleid) {  // 只在新增时设置默认值
            setVehicleInfo(prev => ({
                ...prev,
                vehicle_plate_color: '2',  // 2 代表黄色
            }));
            setDisplayTexts(prev => ({
                ...prev,
                vehiclePlateColor: '黄色'
            }));
        }
    }, []);

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

            // 如果是新增模式，设置默认值
            if (!user_vehicleid) {
                setVehicleInfo(prev => ({
                    ...prev,
                    vehicle_plate_color: '2',  // 2 代表黄色
                }));
                setDisplayTexts(prev => ({
                    ...prev,
                    vehiclePlateColor: optionsData.vehiclePlateColor['2']  // 使用配置中的文本
                }));
            }
        } catch (error) {
            toast.show('获取配置失败');
        }
    };

    // 添加时间选择器的显示状态
    const [openTimeModal, setOpenTimeModal] = useState({
        compulsory_insurance_exp: false,
        vehicle_annual_inspect_exp: false,
        vehicle_annual_audit_exp: false,
        trailer_annual_inspect_exp: false,
        trailer_annual_audit_exp: false
    });

    // 处理时间选择
    const handleTimeChange = (date, field) => {
        setVehicleInfo(prev => ({
            ...prev,
            [field]: date.toISOString()
                .replace('T', ' ')
                .replace('Z', '')
                .split('.')[0]
        }));
        setOpenTimeModal(prev => ({
            ...prev,
            [field]: false
        }));
    };

    // 渲染日期选择器
    const renderDatePicker = (field, title) => (
        <DatePicker
            isVisible={openTimeModal[field]}
            date={vehicleInfo[field] ? new Date(vehicleInfo[field]) : new Date()}
            onConfirm={(date) => handleTimeChange(date, field)}
            onCancel={() => setOpenTimeModal(prev => ({ ...prev, [field]: false }))}
            mode="date"
            title={title}
        />
    );

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
            onPress={() => {
                if (type === 'settleMethod' || !isDisabled) {
                    handleSelectClick(type);
                }
            }}
            disabled={type !== 'settleMethod' && isDisabled}
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
            toast.show('请上传注册车辆（牵引车）行驶证正页');
            return false;
        }
        if (!vehicleInfo.driving_lic_side_pic) {
            toast.show('请上传注册车辆（牵引车）行驶证年审页');
            return false;
        }
        if (!vehicleInfo.vechile_operation_pic) {
            toast.show('请上传注册车辆（牵引车）营运证正页');
            return false;
        }
        if (!vehicleInfo.vechile_operation_side_pic) {
            toast.show('请上传注册车辆（牵引车）营运证年审页');
            return false;
        }
        if (!vehicleInfo.road_trans_cert_pic) {
            toast.show('请上传道路运输证');
            return false;
        }
        if (!vehicleInfo.trailer_driving_lic_pic) {
            toast.show('请上传挂车行驶证正页');
            return false;
        }
        if (!vehicleInfo.trailer_driving_lic_side_pic) {
            toast.show('请上传挂车行驶证年审页');
            return false;
        }
        if (!vehicleInfo.trailer_operation_pic) {
            toast.show('请上传挂车营运证正页');
            return false;
        }
        if (!vehicleInfo.trailer_operation_side_pic) {
            toast.show('请上传挂车营运证年审页');
            return false;
        }
        if (!vehicleInfo.man_vehicle_pic) {
            toast.show('请上传人车合照');
            return false;
        }
        return true;
    };

    // 处理查询按钮点击
    const handleSearchPress = () => {
        if (!displayTexts.settleMethod) {
            toast.show('请选择结算方式');
            return;
        }
        setSearchKeyword('');
        setSettleList([]);
        setSettlementVisible(true);
    };

    // 搜索结算人/公司
    const handleSearch = async () => {
        if (!searchKeyword) {
            toast.show('请输入搜索关键词');
            return;
        }

        try {
            // 根据显示文本判断结算方式
            const settleMethod = displayTexts.settleMethod === '按个人结算' ? '1' : '2';

            const res = await request.get('/app_driver/vehicle/getSettlerSearch', {
                key_word: searchKeyword,
                settle_method: settleMethod  // 使用转换后的结算方式值
            });

            if (res.code === 0) {
                setSettleList(res.data || []);
            } else {
                toast.show(res.msg || '搜索失败');
            }
        } catch (error) {
            toast.show('搜索失败');
        }
    };

    // 添加选中结算人的处理函数
    const handleSettleSelect = (selectedItem, index) => {
        // 创建新的列表，将所有项的 selected 设为 false
        const newList = settleList.map(item => ({
            ...item,
            selected: false
        }));

        // 将当前点击项的 selected 设为 true
        newList[index] = {
            ...selectedItem,
            selected: true
        };

        // 更新列表状态
        setSettleList(newList);
    };

    // 渲染结算人列表项
    const renderSettleItem = (item, index) => (
        <TouchableOpacity
            key={index}
            style={[
                styles.settleItem,
                item.selected && styles.settleItemSelected
            ]}
            onPress={() => handleSettleSelect(item, index)}
        >
            <View style={styles.settleInfo}>
                <View style={styles.settleRow}>
                    <Text style={styles.settleLabel}>姓名：</Text>
                    <Text style={styles.settleValue}>{item.name}</Text>
                </View>
                <View style={styles.settleRow}>
                    <Text style={styles.settleLabel}>手机号：</Text>
                    <Text style={styles.settleValue}>{item.mobile}</Text>
                </View>
                <View style={styles.settleRow}>
                    <Text style={styles.settleLabel}>银行卡号：</Text>
                    <Text style={styles.settleValue}>{item.bank_card_no}</Text>
                </View>
            </View>
            {item.settle_method == 1 && <View style={[
                styles.settleStatus,
                { backgroundColor: item.three_elements_status === 1 ? '#52c41a' : '#ff4d4f' }
            ]}>
                <Text style={styles.settleStatusText}>
                    {item.three_elements_status === 1 ? '三要素验证通过' : '三要素未验证'}
                </Text>
            </View>}
        </TouchableOpacity>
    );

    // 渲染结算人搜索弹框
    const renderSettlementModal = () => {
        // 获取当前选择的结算方式
        const isPersonalSettle = displayTexts.settleMethod === '按个人结算';

        return (
            <Modal
                visible={settlementVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSettlementVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.settlementContainer}>
                        {/* 标题栏 */}
                        <View style={styles.settlementHeader}>
                            <Text style={styles.settlementTitle}>
                                {isPersonalSettle ? '选择结算人' : '选择结算公司'}
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setSettlementVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>×</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 搜索框 */}
                        <View style={styles.searchContainer}>
                            <View style={styles.searchInputWrapper}>
                                <MaterialCommunityIcons name="magnify" size={20} color="#999" />
                                <TextInput
                                    style={styles.searchInput}
                                    value={searchKeyword}
                                    onChangeText={setSearchKeyword}
                                    placeholder={isPersonalSettle
                                        ? '搜索结算人姓名、手机号'
                                        : '搜索结算公司'
                                    }
                                    placeholderTextColor="#999"
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.searchBtn}
                                onPress={handleSearch}
                            >
                                <Text style={styles.searchBtnText}>搜索</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 结算人列表 */}
                        <ScrollView style={styles.settleList}>
                            {settleList.map((item, index) => renderSettleItem(item, index))}
                        </ScrollView>

                        {/* 底部确定按钮 */}
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmButtonText}>确定</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    // 处理确定按钮点击
    const handleConfirm = () => {
        // 找到选中的结算人/公司
        const selectedItem = settleList.find(item => item.selected);

        if (selectedItem) {
            // 更新 vehicleInfo
            setVehicleInfo(prev => ({
                ...prev,
                name: selectedItem.name,
                mobile: selectedItem.mobile,
                bank_card_no: selectedItem.bank_card_no,
                bank_name: selectedItem.bank_name,
                settle_method: selectedItem.settle_method,
                settler_id: selectedItem.id
            }));
        }

        // 关闭弹框
        setSettlementVisible(false);
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
                            style={[styles.input, isDisabled && styles.readOnlyInput]}
                            value={vehicleInfo.vehicle_number}
                            onChangeText={text => setVehicleInfo(prev => ({
                                ...prev,
                                vehicle_number: text
                            }))}
                            placeholder="请输入车牌号"
                            editable={!isDisabled}
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
                        <Text style={styles.inputLabel}>整备质量(KG)</Text>
                    </View>
                    <TextInput
                        style={[styles.input, isDisabled && styles.readOnlyInput]}
                        value={vehicleInfo.vehicle_laden_weight}
                        onChangeText={text => setVehicleInfo(prev => ({
                            ...prev,
                            vehicle_laden_weight: text
                        }))}
                        placeholder="请输入整备质量"
                        keyboardType="numeric"
                        editable={!isDisabled}
                    />
                </View>

                {/* 核定载质量 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.inputLabel}>核定载质量(KG)</Text>
                    </View>
                    <TextInput
                        style={[styles.input, isDisabled && styles.readOnlyInput]}
                        value={vehicleInfo.vehicle_tonnage}
                        onChangeText={text => setVehicleInfo(prev => ({
                            ...prev,
                            vehicle_tonnage: text
                        }))}
                        placeholder="请输入核定载质量"
                        keyboardType="numeric"
                        editable={!isDisabled}
                    />
                </View>

                {renderSelectItem('牌照类型', 'licPlateCode', true)}
                {renderSelectItem('车辆分类', 'vehicleClassCode', true)}
                {renderSelectItem('车辆颜色', 'vehiclePlateColor', false)}

                {/* 业户名称 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.inputLabel}>业户名称</Text>
                    </View>
                    <TextInput
                        style={[styles.input, isDisabled && styles.readOnlyInput]}
                        value={vehicleInfo.carrier_name}
                        onChangeText={text => setVehicleInfo(prev => ({
                            ...prev,
                            carrier_name: text
                        }))}
                        placeholder="请输入业户名称"
                        editable={!isDisabled}
                    />
                </View>

                {renderSelectItem('车辆品牌', 'vehicleBrands', false)}

                {/* 结算方式 */}
                <View style={styles.selectItem}>
                    <View style={styles.selectLeft}>
                        <Text style={styles.required}>*</Text>
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
                            onPress={handleSearchPress}
                        >
                            <Text style={styles.searchButtonText}>查询</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 结算人信息 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.inputLabel}>结算人姓名</Text>
                    </View>
                    <TextInput
                        style={[styles.input, isDisabled && styles.readOnlyInput]}
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
                        style={[styles.input, isDisabled && styles.readOnlyInput]}
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
                        style={[styles.input, isDisabled && styles.readOnlyInput]}
                        value={vehicleInfo.bank_card_no}
                        editable={false}
                        placeholder="请选择结算人"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.inputLabel}>结算人开户行</Text>
                    </View>
                    <View style={styles.inputRight}>
                        <TextInput
                            style={[styles.input, isDisabled && styles.readOnlyInput]}
                            value={vehicleInfo.bank_name}
                            editable={false}
                            placeholder="请选择结算人"
                        />
                    </View>
                </View>

                {/* 业务类型 */}
                {/* {renderSelectItem('业务类型', 'carrierType', false)} */}

                {/* 道路运输证号 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.inputLabel}>道路运输证号</Text>
                    </View>
                    <View style={styles.inputRight}>
                        <TextInput
                            style={[styles.input, isDisabled && styles.readOnlyInput]}
                            value={vehicleInfo.road_trans_cert_number}
                            onChangeText={text => setVehicleInfo(prev => ({
                                ...prev,
                                road_trans_cert_number: text
                            }))}
                            placeholder="请输入道路运输证号"
                            editable={!isDisabled}
                        />
                    </View>
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
                            showDelete={!isDisabled && !!vehicleInfo.vehicle_policy}
                            disabled={isDisabled}
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

                {/* 交强险过期时间 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.inputLabel}>交强险过期时间</Text>
                    </View>
                    <View style={styles.inputRight}>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setOpenTimeModal(prev => ({ ...prev, compulsory_insurance_exp: true }))}
                            disabled={isDisabled}
                        >
                            <Text style={[styles.datePickerText, isDisabled && styles.readOnlyInput]}>
                                {vehicleInfo.compulsory_insurance_exp || "请选择日期"}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>
                    {renderDatePicker('compulsory_insurance_exp', '交强险过期时间')}
                </View>

                <View style={styles.uploadGroup}>
                    <View style={styles.uploadLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.uploadTitle}>注册车辆（牵引车）行驶证正页</Text>
                    </View>
                    <View style={styles.uploadContent}>
                        <ImagePicker
                            files={vehicleInfo.driving_lic_pic ? [{
                                url: vehicleInfo.driving_lic_pic
                            }] : []}
                            onUpload={(file) => handleImageUpload(file, 1)}
                            onDelete={() => handleImageDelete(1)}
                            showDelete={!isDisabled && !!vehicleInfo.driving_lic_pic}
                            disabled={isDisabled}
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
                        <Text style={styles.uploadTitle}>注册车辆（牵引车）行驶证年审页</Text>
                    </View>
                    <View style={styles.uploadContent}>
                        <ImagePicker
                            files={vehicleInfo.driving_lic_side_pic ? [{
                                url: vehicleInfo.driving_lic_side_pic
                            }] : []}
                            onUpload={(file) => handleImageUpload(file, 2)}
                            onDelete={() => handleImageDelete(2)}
                            showDelete={!isDisabled && !!vehicleInfo.driving_lic_side_pic}
                            disabled={isDisabled}
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

                {/* （牵引车）车辆年检过期日期 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.inputLabel}>（牵引车）车辆年检过期日期</Text>
                    </View>
                    <View style={styles.inputRight}>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setOpenTimeModal(prev => ({ ...prev, vehicle_annual_inspect_exp: true }))}
                            disabled={isDisabled}
                        >
                            <Text style={[styles.datePickerText, isDisabled && styles.readOnlyInput]}>
                                {vehicleInfo.vehicle_annual_inspect_exp || "请选择日期"}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>
                    {renderDatePicker('vehicle_annual_inspect_exp', '（牵引车）车辆年检过期日期')}
                </View>

                <View style={styles.uploadGroup}>
                    <View style={styles.uploadLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.uploadTitle}>注册车辆（牵引车）营运证正页</Text>
                    </View>
                    <View style={styles.uploadContent}>
                        <ImagePicker
                            files={vehicleInfo.vechile_operation_pic ? [{
                                url: vehicleInfo.vechile_operation_pic
                            }] : []}
                            onUpload={(file) => handleImageUpload(file, 3)}
                            onDelete={() => handleImageDelete(3)}
                            showDelete={!isDisabled && !!vehicleInfo.vechile_operation_pic}
                            disabled={isDisabled}
                        />
                        <View style={styles.exampleContainer}>
                            <Image
                                source={{ uri: 'https://test-shensy.ship56.net/shensy_driver_xcx_images/vehicle-f-3-1.png' }}
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
                        <Text style={styles.uploadTitle}>注册车辆（牵引车）营运证年审页</Text>
                    </View>
                    <View style={styles.uploadContent}>
                        <ImagePicker
                            files={vehicleInfo.vechile_operation_side_pic ? [{
                                url: vehicleInfo.vechile_operation_side_pic
                            }] : []}
                            onUpload={(file) => handleImageUpload(file, 4)}
                            onDelete={() => handleImageDelete(4)}
                            showDelete={!isDisabled && !!vehicleInfo.vechile_operation_side_pic}
                            disabled={isDisabled}
                        />
                        <View style={styles.exampleContainer}>
                            <Image
                                source={{ uri: 'https://test-shensy.ship56.net/shensy_driver_xcx_images/vehicle-f-3-2.png' }}
                                style={styles.exampleImage}
                            />
                            <View style={styles.exampleLabel}>
                                <Text style={styles.exampleText}>示例</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* （牵引车）营运证年审过期日期 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.inputLabel}>（牵引车）营运证年审过期日期</Text>
                    </View>
                    <View style={styles.inputRight}>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setOpenTimeModal(prev => ({ ...prev, vehicle_annual_audit_exp: true }))}
                            disabled={isDisabled}
                        >
                            <Text style={[styles.datePickerText, isDisabled && styles.readOnlyInput]}>
                                {vehicleInfo.vehicle_annual_audit_exp || "请选择日期"}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>
                    {renderDatePicker('vehicle_annual_audit_exp', '（牵引车）营运证年审过期日期 ')}
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
                            onUpload={(file) => handleImageUpload(file, 5)}
                            onDelete={() => handleImageDelete(5)}
                            showDelete={!isDisabled && !!vehicleInfo.road_trans_cert_pic}
                            disabled={isDisabled}
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
                        <Text style={styles.uploadTitle}>注册车辆（挂车）行驶证正页</Text>
                    </View>
                    <View style={styles.uploadContent}>
                        <ImagePicker
                            files={vehicleInfo.trailer_driving_lic_pic ? [{
                                url: vehicleInfo.trailer_driving_lic_pic
                            }] : []}
                            onUpload={(file) => handleImageUpload(file, 6)}
                            onDelete={() => handleImageDelete(6)}
                            showDelete={!isDisabled && !!vehicleInfo.trailer_driving_lic_pic}
                            disabled={isDisabled}
                        />
                        <View style={styles.exampleContainer}>
                            <Image
                                source={{ uri: 'https://test-shensy.ship56.net/shensy_driver_xcx_images/trailer-lic-1.png' }}
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
                        <Text style={styles.uploadTitle}>注册车辆（挂车）行驶证年审页</Text>
                    </View>
                    <View style={styles.uploadContent}>
                        <ImagePicker
                            files={vehicleInfo.trailer_driving_lic_side_pic ? [{
                                url: vehicleInfo.trailer_driving_lic_side_pic
                            }] : []}
                            onUpload={(file) => handleImageUpload(file, 7)}
                            onDelete={() => handleImageDelete(7)}
                            showDelete={!isDisabled && !!vehicleInfo.trailer_driving_lic_side_pic}
                            disabled={isDisabled}
                        />
                        <View style={styles.exampleContainer}>
                            <Image
                                source={{ uri: 'https://test-shensy.ship56.net/shensy_driver_xcx_images/trailer-lic-2.png' }}
                                style={styles.exampleImage}
                            />
                            <View style={styles.exampleLabel}>
                                <Text style={styles.exampleText}>示例</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* （挂车）车辆年检过期日期 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.inputLabel}>（挂车）车辆年检过期日期</Text>
                    </View>
                    <View style={styles.inputRight}>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setOpenTimeModal(prev => ({ ...prev, trailer_annual_inspect_exp: true }))}
                            disabled={isDisabled}
                        >
                            <Text style={[styles.datePickerText, isDisabled && styles.readOnlyInput]}>
                                {vehicleInfo.trailer_annual_inspect_exp || "请选择日期"}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>
                    {renderDatePicker('trailer_annual_inspect_exp', '（挂车）车辆年检过期日期')}
                </View>

                <View style={styles.uploadGroup}>
                    <View style={styles.uploadLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.uploadTitle}>注册车辆（挂车）营运证正页</Text>
                    </View>
                    <View style={styles.uploadContent}>
                        <ImagePicker
                            files={vehicleInfo.trailer_operation_pic ? [{
                                url: vehicleInfo.trailer_operation_pic
                            }] : []}
                            onUpload={(file) => handleImageUpload(file, 8)}
                            onDelete={() => handleImageDelete(8)}
                            showDelete={!isDisabled && !!vehicleInfo.trailer_operation_pic}
                            disabled={isDisabled}
                        />
                        <View style={styles.exampleContainer}>
                            <Image
                                source={{ uri: 'https://test-shensy.ship56.net/shensy_driver_xcx_images/trailer-f-1.png' }}
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
                        <Text style={styles.uploadTitle}>注册车辆（挂车）营运证年审页</Text>
                    </View>
                    <View style={styles.uploadContent}>
                        <ImagePicker
                            files={vehicleInfo.trailer_operation_side_pic ? [{
                                url: vehicleInfo.trailer_operation_side_pic
                            }] : []}
                            onUpload={(file) => handleImageUpload(file, 9)}
                            onDelete={() => handleImageDelete(9)}
                            showDelete={!isDisabled && !!vehicleInfo.trailer_operation_side_pic}
                            disabled={isDisabled}
                        />
                        <View style={styles.exampleContainer}>
                            <Image
                                source={{ uri: 'https://test-shensy.ship56.net/shensy_driver_xcx_images/trailer-f-2.png' }}
                                style={styles.exampleImage}
                            />
                            <View style={styles.exampleLabel}>
                                <Text style={styles.exampleText}>示例</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* （挂车）营运证年审过期日期 */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputLeft}>
                        <Text style={styles.required}>*</Text>
                        <Text style={styles.inputLabel}>（挂车）营运证年审过期日期</Text>
                    </View>
                    <View style={styles.inputRight}>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setOpenTimeModal(prev => ({ ...prev, trailer_annual_audit_exp: true }))}
                            disabled={isDisabled}
                        >
                            <Text style={[styles.datePickerText, isDisabled && styles.readOnlyInput]}>
                                {vehicleInfo.trailer_annual_audit_exp || "请选择日期"}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>
                    {renderDatePicker('trailer_annual_audit_exp', '（挂车）营运证年审过期日期 ')}
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
                            onUpload={(file) => handleImageUpload(file, 10)}
                            onDelete={() => handleImageDelete(10)}
                            showDelete={!isDisabled && !!vehicleInfo.man_vehicle_pic}
                            disabled={isDisabled}
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

            {/* 底部固定按钮 */}
            <SafeAreaView style={styles.bottomSafeArea}>
                <View style={styles.bottomBtnContainer}>
                    <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={() => {
                            if (validateForm()) {
                                onSubmit(vehicleInfo);
                            }
                        }}
                    >
                        <Text style={styles.submitBtnText}>提交</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {renderSettlementModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    scrollView: {
        flex: 1
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
        justifyContent: 'flex-end'
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 4,
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
        // 移除 backgroundColor
        // backgroundColor: '#f0f0f0',
    },
    selectValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    settlementContainer: {
        flex: 1,
        backgroundColor: '#fff',
        marginTop: 50,
    },
    settlementHeader: {
        height: 45,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        position: 'relative',
    },
    settlementTitle: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    closeButton: {
        position: 'absolute',
        right: 15,
        top: 10,
        width: 25,
        height: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: '#999',
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
        paddingHorizontal: 10,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 36,
        fontSize: 14,
        color: '#333',
        paddingLeft: 5,
    },
    searchBtn: {
        backgroundColor: '#1892e5',
        borderRadius: 4,
        paddingHorizontal: 15,
        justifyContent: 'center',
    },
    searchBtnText: {
        color: '#fff',
        fontSize: 14,
    },
    settleList: {
        flex: 1,
    },
    settleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settleItemSelected: {
        backgroundColor: '#ECF4FB',
    },
    settleInfo: {
        flex: 1,
    },
    settleRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    settleLabel: {
        width: 70,
        fontSize: 14,
        color: '#999',
    },
    settleValue: {
        fontSize: 14,
        color: '#333',
    },
    settleStatus: {
        backgroundColor: '#ff4d4f',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 2,
    },
    settleStatusSuccess: {
        backgroundColor: '#52c41a',
    },
    settleStatusText: {
        color: '#fff',
        fontSize: 12,
    },
    confirmButton: {
        height: 50,
        backgroundColor: '#1892e5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    bottomSafeArea: {
        backgroundColor: '#fff'
    },
    bottomBtnContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#eee',
        backgroundColor: '#fff'
    },
    submitBtn: {
        backgroundColor: '#1890ff',
        height: 44,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center'
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500'
    }
});

export default AddCommVehicle;
