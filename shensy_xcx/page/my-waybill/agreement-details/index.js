import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    Modal,
    Dimensions,
    SafeAreaView,
    Alert,
    Linking,
} from 'react-native';
import * as Location from 'expo-location';
import request from '../../../util/request';
import toast from '../../../util/toast';
import ImagePreview from '../../../components/ImagePreview';
import DatePicker from '../../../components/DatePicker';
import Dialog from '../../../components/Dialog';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function AgreementDetails({ route, navigation }) {
    const { waybill_id, waybill_no, from_flag } = route.params;
    const [waybillInfo, setWaybillInfo] = useState(null);
    const [unloadPlaces, setUnloadPlaces] = useState([]);
    const [activeStep, setActiveStep] = useState(0);
    const [safeChecked, setSafeChecked] = useState(false);
    const [lightningPayChecked, setLightningPayChecked] = useState(false);
    const [location, setLocation] = useState(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImages, setPreviewImages] = useState([]);
    const [openDepartureTimeModal, setOpenDepartureTimeModal] = useState(false);
    const [departureTimeError, setDepartureTimeError] = useState(false);
    const [lightningVisible, setLightningVisible] = useState(false);
    const scrollViewRef = useRef(null);
    const departureTimeRef = useRef(null);

    // 检查位置权限
    const checkLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setLocation(location);
            } else {
                toast.show('需要位置权限才能继续操作');
            }
        } catch (error) {
            console.error('位置权限检查失败:', error);
        }
    };

    // 获取运单详情
    const getWaybillInfo = async () => {
        try {
            const res = await request.get('/app_driver/waybill/getWaybillInfo', {
                waybill_id
            }, true);
            if (res.code === 0 && res.data) {
                let {
                    data: {
                        is_fix_price,
                        price_type,
                        price_per_ton,
                        price_per_cube,
                        price_per_vehicle,
                        is_lightning_pay
                    }
                } = res
                if (is_fix_price == 1) {
                    //固定价格逻辑
                    let mapData = new Map([
                        [1, price_per_vehicle],
                        [2, price_per_ton],
                        [3, price_per_cube]
                    ])
                    res.data.transport_price = mapData.get(price_type)
                }
                setWaybillInfo(res.data);
                setLightningPayChecked(is_lightning_pay === 1);
            } else {
                toast.show(res.msg || '获取运单详情失败');
            }
        } catch (error) {
            toast.show('获取运单详情失败');
        }
    };

    // 获取异地卸货点列表
    const getUnloadPlaces = async () => {
        try {
            const res = await request.get('/app_driver/unload_place/getList', {
                waybill_id,
                waybill_no,
                page: 1,
                pageSize: 100
            });
            
            if (res.code === 0) {
                setUnloadPlaces(res.data.list || []);
            } else {
                // 只在真正的错误时显示提示
                if (res.code !== 0) {
                    toast.show(res.msg || '获取异地卸货点失败');
                }
            }
        } catch (error) {
            // 只在网络错误等情况下显示提示
            if (error.message !== 'Network Error') {
                toast.show('获取异地卸货点失败');
            }
        }
    };

    // 闪电付勾选
    const handleLightningPayChange = () => {
        if (!lightningPayChecked) {
            setLightningVisible(true);
        } else {
            setLightningPayChecked(false);
            setWaybillInfo(prev => ({
                ...prev,
                is_lightning_pay: '0'
            }));
        }
    };

    // 添加闪电付确认处理函数
    const handleLightningConfirm = () => {
        setLightningPayChecked(true);
        setWaybillInfo(prev => ({
            ...prev,
            is_lightning_pay: '1'
        }));
        setLightningVisible(false);
    };

    // 确认发车
    const handleStart = async () => {
        if (activeStep === 0) {
            if (!waybillInfo.departure_time) {
                toast.show('请选择发车时间');
                departureTimeRef.current?.measure((x, y, width, height, pageX, pageY) => {
                    scrollViewRef.current?.scrollTo({
                        y: pageY,
                        animated: true
                    });
                });
                setDepartureTimeError(true);
                return;
            }
            setActiveStep(1);
        } else {
            if (!safeChecked) {
                toast.show('请阅读并同意安全注意事项');
                return;
            }
            try {
                const res = await request.post('/app_driver/waybill/driverDeparture', {
                    waybill_id,
                    is_lightning_pay: waybillInfo.is_lightning_pay,
                    departure_time: waybillInfo.departure_time,
                    lng: location?.coords.longitude,
                    lat: location?.coords.latitude
                });
                if (res.code === 0) {
                    toast.show('操作成功');
                    navigation.goBack();
                } else {
                    toast.show(res.msg || '操作失败');
                }
            } catch (error) {
                toast.show('操作失败');
            }
        }
    };

    // 修改日期选择处理函数
    const handleDateChange = (date) => {
        setWaybillInfo(prevState => ({
            ...prevState,
            departure_time: date.toISOString()
                .replace('T', ' ')
                .replace('Z', '')
                .split('.')[0]
        }));
        setDepartureTimeError(false);
        setOpenDepartureTimeModal(false);
    };

    useEffect(() => {
        if (from_flag === 'start') {
            navigation.setOptions({
                title: route.params.title || '协议单详情'
            });
            checkLocationPermission();
        }
        getWaybillInfo();
        // 只在需要时获取异地卸货点
        if (waybill_id && waybill_no) {
            getUnloadPlaces();
        }
    }, []);

    useEffect(() => {
        if (waybillInfo?.safe_template) {
            setPreviewImages([waybillInfo.safe_template]);
        }
    }, [waybillInfo?.safe_template]);

    useEffect(() => {
        // 设置导航栏标题和右侧按钮
        navigation.setOptions({
            title: from_flag === 'start' ? '确认发车' : '协议单详情',
            headerRight: () => (
                <TouchableOpacity
                    style={styles.headerRightButton}
                    onPress={() => {
                        if (!waybillInfo?.employee_phone) {
                            toast.show('暂无联系电话');
                            return;
                        }

                        Alert.alert(
                            '提示',
                            `是否拨打电话 ${waybillInfo.employee_phone}？`,
                            [
                                { text: '取消', style: 'cancel' },
                                {
                                    text: '确定',
                                    onPress: () => {
                                        Linking.openURL(`tel:${waybillInfo.employee_phone}`).catch(err => {
                                            console.error('拨打电话失败:', err);
                                            toast.show('拨打电话失败');
                                        });
                                    }
                                }
                            ]
                        );
                    }}
                >
                    <MaterialCommunityIcons
                        name="phone"
                        size={24}
                        color="#1892e5"
                    />
                </TouchableOpacity>
            )
        });
    }, [navigation, from_flag, waybillInfo?.employee_phone]);

    if (!waybillInfo) {
        return null;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {from_flag === 'start' && (
                <View style={styles.stepsContainer}>
                    <View style={styles.stepsLine}>
                        {/* 第一步 */}
                        <View style={[styles.stepCircle, activeStep >= 0 && styles.stepCircleActive]}>
                            <Text style={[styles.stepNumber, activeStep >= 0 && styles.stepNumberActive]}>1</Text>
                        </View>
                        {/* 连接线 */}
                        <View style={[styles.line, activeStep >= 1 && styles.lineActive]} />
                        {/* 第二步 */}
                        <View style={[styles.stepCircle, activeStep >= 1 && styles.stepCircleActive]}>
                            <Text style={[styles.stepNumber, activeStep >= 1 && styles.stepNumberActive]}>2</Text>
                        </View>
                    </View>
                </View>
            )}
            <ScrollView
                ref={scrollViewRef}
                style={styles.container}
            >
                {activeStep === 0 ? (
                    <>
                        {/* 结余金额 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>结余金额</Text>
                            <Text style={styles.value}>¥ {waybillInfo.waybill_balance}</Text>
                        </View>
                        <View style={styles.section}>
                            <Text style={styles.label}>扣款总额(包含油卡押金、轮胎捐款、定位使用费、箱损、货损捐款等)</Text>
                        </View>
                        {/* 协议单状态 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>协议单状态</Text>
                            <Text style={styles.value}>
                                {waybillInfo.is_settlement_created == 1 ? '已制单' : '未制单'}
                            </Text>
                        </View>
                        {/* 是否已申请闪电支付 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>是否已申请闪电支付</Text>
                            <Text style={styles.value}>
                                {waybillInfo.is_lightning_pay == 1 ? '是' : '否'}
                            </Text>
                        </View>
                        {/* 实付金额 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>实付金额</Text>
                            <Text style={styles.value}>
                                ￥{waybillInfo.actual_payment_amount}
                            </Text>
                        </View>
                        {/* 协议单号 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>协议单号</Text>
                            <Text style={styles.value}>
                                {waybillInfo.contract_no}
                            </Text>
                        </View>
                        {/* 协议照片 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>协议照片</Text>
                            <View style={styles.imageContainer}>
                                {waybillInfo.contract_media_text && waybillInfo.contract_media_text.split(',').filter(Boolean).map((url, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => {
                                            const images = waybillInfo.contract_media_text.split(',').filter(Boolean);
                                            setPreviewImages(images);
                                            setPreviewVisible(true);
                                        }}
                                    >
                                        <Image
                                            source={{ uri: url }}
                                            style={styles.thumbnail}
                                        />
                                    </TouchableOpacity>
                                ))}
                                {(!waybillInfo.contract_media_text || waybillInfo.contract_media_text.length === 0) && (
                                    <Text style={styles.noImageText}>暂无照片</Text>
                                )}
                            </View>
                        </View>
                        {/* 单号照片 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>单号照片</Text>
                            <View style={styles.imageContainer}>
                                {waybillInfo.order_no_media_text && waybillInfo.order_no_media_text.split(',').filter(Boolean).map((url, index) => (
                                    <TouchableOpacity key={index} onPress={() => {
                                        const images = waybillInfo.order_no_media_text.split(',').filter(Boolean);
                                        setPreviewImages(images);
                                        setPreviewVisible(true);
                                    }}>
                                        <Image source={{ uri: url }} style={styles.thumbnail} />
                                    </TouchableOpacity>
                                ))}
                                {(!waybillInfo.order_no_media_text || waybillInfo.order_no_media_text.length === 0) && (
                                    <Text style={styles.noImageText}>暂无照片</Text>
                                )}
                            </View>
                        </View>
                        {/* 协议时间 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>协议时间</Text>
                            <Text style={styles.value}>
                                {waybillInfo.contract_create_time}
                            </Text>
                        </View>
                        {/* 客户单号 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>客户单号</Text>
                            <Text style={styles.value}>
                                {waybillInfo.summary_customer_no}
                            </Text>
                        </View>
                        {/* 结算人姓名 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>结算人姓名</Text>
                            <Text style={styles.value}>
                                {waybillInfo.payee_name}
                            </Text>
                        </View>
                        {/* 车牌号 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>车牌号</Text>
                            <Text style={styles.value}>
                                {waybillInfo.vehicle_number}
                            </Text>
                        </View>
                        {/* 手机号 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>手机号</Text>
                            <Text style={styles.value}>
                                {waybillInfo.driver_mobile}
                            </Text>
                        </View>
                        {/* 银行卡号 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>银行卡号</Text>
                            <Text style={styles.value}>
                                {waybillInfo.bank_card_no}
                            </Text>
                        </View>
                        {/* 结算公司 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>结算公司</Text>
                            <Text style={styles.value}>
                                {waybillInfo.payee_company_name}
                            </Text>
                        </View>
                        {/* 轮胎及配件 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>轮胎及配件</Text>
                            <Text style={styles.value}>
                                ￥{waybillInfo.tire_accessories_amount}
                            </Text>
                        </View>
                        {/* 油卡金额 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>油卡金额</Text>
                            <Text style={styles.value}>
                                ￥{waybillInfo.oil_card_amount}
                            </Text>
                        </View>
                        {/* 保费金额 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>保费金额</Text>
                            <Text style={styles.value}>
                                ￥{waybillInfo.insurance_amount}
                            </Text>
                        </View>
                        {/* 预付运费 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>预付运费</Text>
                            <Text style={styles.value}>
                                ￥{waybillInfo.prepaid_freight}
                            </Text>
                        </View>
                        {/* 回单付 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>回单付</Text>
                            <Text style={styles.value}>
                                ￥{waybillInfo.return_receipt_amount}
                            </Text>
                        </View>
                        {/* 领料费 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>领料费</Text>
                            <Text style={styles.value}>
                                ￥{waybillInfo.material_fee}
                            </Text>
                        </View>
                        {/* 项目组 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>项目组</Text>
                            <Text style={styles.value}>
                                {waybillInfo.project_group_name}
                            </Text>
                        </View>
                        {/* 客户名称 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>客户名称</Text>
                            <Text style={styles.value}>
                                {waybillInfo.customer_name}
                            </Text>
                        </View>
                        {/* 供应商名称 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>供应商名称</Text>
                            <Text style={styles.value}>
                                {waybillInfo.vehicle_number}
                            </Text>
                        </View>
                        {/* 计价类型 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>计价类型</Text>
                            <Text style={styles.value}>
                                {waybillInfo.price_type_text}
                            </Text>
                        </View>
                        {/* 单价(元) */}
                        <View style={styles.section}>
                            <Text style={styles.label}>单价(元)</Text>
                            <Text style={styles.value}>
                                ￥{waybillInfo.transport_price}
                            </Text>
                        </View>
                        {/* 装货地址 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>装货地址</Text>
                            <Text style={styles.value}>
                                {waybillInfo.from_city_text}
                            </Text>
                        </View>
                        {/* 详细地址 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>详细地址</Text>
                            <Text style={styles.value}>
                                {waybillInfo.from_detail}
                            </Text>
                        </View>
                        {/* 发车时间 */}
                        <View
                            ref={departureTimeRef}
                            style={[
                                styles.section,
                                departureTimeError && styles.sectionError
                            ]}
                        >
                            <View style={[styles.labelContainer, { flex: 1 }]}>
                                <Text style={styles.requiredStar}>*</Text>
                                <Text style={styles.label}>发车时间</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.value}
                                onPress={() => setOpenDepartureTimeModal(true)}
                            >
                                <Text style={styles.value}>
                                    {waybillInfo.departure_time ? waybillInfo.departure_time : "请选择发车时间"}
                                </Text>
                            </TouchableOpacity>
                            <DatePicker
                                isVisible={openDepartureTimeModal}
                                date={waybillInfo.departure_time ? new Date(waybillInfo.departure_time) : new Date()}
                                onConfirm={handleDateChange}
                                onCancel={() => setOpenDepartureTimeModal(false)}
                                mode="datetime"
                                title="选择发车时间"
                            />
                        </View>
                        {/* 到货地址 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>到货地址</Text>
                            <Text style={styles.value}>
                                {waybillInfo.to_city_text}
                            </Text>
                        </View>
                        {/* 详细地址 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>详细地址</Text>
                            <Text style={styles.value}>
                                {waybillInfo.to_detail}
                            </Text>
                        </View>
                        {/* 重量(吨) */}
                        <View style={styles.section}>
                            <Text style={styles.label}>重量(吨)</Text>
                            <Text style={styles.value}>
                                {waybillInfo.goods_weight}
                            </Text>
                        </View>
                        {/* 体积(立方) */}
                        <View style={styles.section}>
                            <Text style={styles.label}>体积(立方)</Text>
                            <Text style={styles.value}>
                                {waybillInfo.goods_volume}
                            </Text>
                        </View>
                        {/* 数量 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>数量</Text>
                            <Text style={styles.value}>
                                {waybillInfo.goods_quantity}
                            </Text>
                        </View>
                        {/* 同城地卸货点/费用 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>同城卸货点/费用</Text>
                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                                {/* 卸货点数量 */}
                                <Text style={styles.value}>
                                    {waybillInfo.local_unload_count}
                                </Text>
                                {/* 卸货点费用 */}
                                <Text style={styles.value}>
                                    {waybillInfo.local_unload_amount}
                                </Text>
                            </View>
                        </View>
                        {/* 异地卸货点/费用 */}
                        <TouchableOpacity
                            style={styles.section}
                            onPress={() => navigation.navigate('RemoteUnload', {
                                waybill_id,
                                waybill_no,
                                unloadPlaces // 传递异地卸货点数据
                            })}
                        >
                            <Text style={styles.label}>异地卸货点/费用</Text>
                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={styles.value}>
                                    {waybillInfo?.nonlocal_unload_count || 0}
                                </Text>
                                <Text style={styles.value}>
                                    {waybillInfo?.nonlocal_unload_amount || 0}
                                </Text>
                            </View>
                            <MaterialIcons
                                name="chevron-right"
                                size={24}
                                color="#999"
                                style={styles.arrowIcon}
                            />
                        </TouchableOpacity>
                        {/* 总份数 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>总份数</Text>
                            <Text style={styles.value}>
                                {waybillInfo.total_receipt_num}
                            </Text>
                        </View>
                        {/* 特殊费用 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>特殊费用</Text>
                            <Text style={styles.value}>
                                {waybillInfo.special_fee}
                            </Text>
                        </View>
                        {/* 特殊说明 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>特殊说明</Text>
                            <Text style={styles.value}>
                                {waybillInfo.special_fee_description}
                            </Text>
                        </View>
                        {/* 签署电子合同 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>签署电子合同</Text>
                            <TouchableOpacity
                                style={styles.contractButton}
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
                                {waybillInfo.contract_sign_status_text && (
                                    <View style={styles.tips}>
                                        <Text style={styles.tipsText} numberOfLines={1}>
                                            {waybillInfo.contract_sign_status_text}
                                        </Text>
                                    </View>
                                )}
                                <MaterialIcons
                                    name="chevron-right"
                                    size={24}
                                    color="#999"
                                    style={styles.arrowIcon}
                                />
                            </TouchableOpacity>
                        </View>
                        {/* 闪电付 */}
                        <View style={styles.section}>
                            <Text style={styles.label}>预约闪电付</Text>
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={handleLightningPayChange}
                            >
                                <View style={[styles.checkboxIcon, lightningPayChecked && styles.checkboxIconChecked]}>
                                    {lightningPayChecked && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                            </TouchableOpacity>
                        </View>
                        {/* 备注 */}
                        <View style={[styles.section, { paddingBottom: 60 }]}>
                            <Text style={styles.label}>备注</Text>
                            <Text style={styles.value}>
                                {waybillInfo.remark}
                            </Text>
                        </View>
                    </>
                ) : (
                    <View style={[styles.safetySection, { padding: 0 }]}>
                        <Text style={styles.safetyTitle}>安全注意事项</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setPreviewVisible(true);
                                setPreviewImages([waybillInfo.safe_template]);
                            }}
                        >
                            <Image
                                source={{ uri: waybillInfo.safe_template }}
                                style={styles.safetyImage}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.checkbox, { paddingLeft: 10 }]}
                            onPress={() => setSafeChecked(!safeChecked)}
                        >
                            <View style={[styles.checkboxIcon, safeChecked && styles.checkboxIconChecked]}>
                                {safeChecked && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.checkboxLabel}>我已阅读并同意以上安全注意事项</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* 底部按钮容器 - 移到 ScrollView 外部 */}
            <View style={styles.bottomButtonsContainer}>
                <View style={styles.bottomButtons}>
                    {/* 只在第二步显示"上一步"按钮 */}
                    {activeStep === 1 && (
                        <TouchableOpacity
                            style={[styles.button, styles.prevButton]}
                            onPress={() => setActiveStep(0)}
                        >
                            <Text style={styles.prevButtonText}>上一步</Text>
                        </TouchableOpacity>
                    )}

                    {/* 确认按钮 */}
                    {from_flag === 'start' && <TouchableOpacity
                        style={[
                            styles.button,
                            styles.confirmButton,
                            (activeStep === 0 ? (waybillInfo.contract_type == 1 && waybillInfo.sign_status != 30) : !safeChecked) && styles.buttonDisabled,
                            activeStep === 1 && styles.buttonWithPrev
                        ]}
                        onPress={handleStart}
                        disabled={(activeStep === 0 ? (waybillInfo.contract_type == 1 && waybillInfo.sign_status != 30) : !safeChecked)}
                    >
                        <Text style={styles.confirmButtonText}>
                            {activeStep === 0 ? '发车' : '确认发车'}
                        </Text>
                    </TouchableOpacity>}
                </View>
            </View>

            {/* 修改闪电付确认弹窗 */}
            <Dialog
                visible={lightningVisible}
                title="闪电付申请须知"
                onCancel={() => setLightningVisible(false)}
                onConfirm={handleLightningConfirm}
                cancelText="不同意"
                confirmText="同意"
            >
                <ScrollView style={styles.dialogScroll}>
                    <Text style={styles.dialogText}>
                        申请闪电付后，将会在结余运费金额中扣除一定比例手续费或用里程值抵扣手续费。
                    </Text>
                    <Text style={[styles.dialogText, styles.dialogTitle]}>闪电付申请规则：</Text>
                    <Text style={styles.dialogText}>
                        1. 回单寄回项目组，项目经理审核通过之后，司机方可申请闪电付。{'\n'}
                        2. 闪电付申请为司机主观意识申请，我司不强制司机申请闪电付。{'\n'}
                        3. 闪电付申请之后将无法撤销。
                    </Text>
                    <Text style={[styles.dialogText, styles.dialogTitle]}>
                        闪电付申请相关免责声明，请务必认真阅读：
                    </Text>
                    <Text style={styles.dialogText}>
                        1. 由于用户将个人密码告知他人或与他人共享注册账户，由此导致的任何个人资料泄露，由此产生的纠纷我司不负任何责任。{'\n\n'}
                        2. 如因系统维护或升级而需暂停此服务时，将事先公告。如因政府及非本企业控制范围外的硬件故障或者其他不可抗力而导致暂停服务，于暂停服务期间造成的一切不便与损失，我司不负任何责任。{'\n\n'}
                        3. 本声明未涉及的问题参照国家有关法律法规，当本声明与国家法律法规冲突时，以国家法律法规为准。{'\n\n'}
                        4. 本声明修改权、更新权及最终解释权均属上海申丝企业发展有限公司所有。
                    </Text>
                </ScrollView>
            </Dialog>

            {/* 图片预览组件 - 移到最外层 */}
            <ImagePreview
                visible={previewVisible}
                images={previewImages}
                onClose={() => setPreviewVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    section: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    required: {
        borderColor: '#ff4d4f',
        borderWidth: 1,
    },
    amount: {
        fontSize: 24,
        color: '#333',
        fontWeight: 'bold',
        marginVertical: 10,
    },
    desc: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    label: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    value: {
        fontSize: 16,
        color: '#333',
        textAlign: 'right',
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    checkboxIcon: {
        width: 20,
        height: 20,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxIconChecked: {
        backgroundColor: '#1892e5',
        borderColor: '#1892e5',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#333',
    },
    safetySection: {
        padding: 15,
    },
    safetyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        paddingLeft: 10,
    },
    safetyContent: {
        fontSize: 14,
        color: '#666',
        lineHeight: 24,
        marginBottom: 20,
    },
    startButton: {
        margin: 15,
        backgroundColor: '#1892e5',
        height: 44,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    startButtonDisabled: {
        backgroundColor: '#ccc',
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    unloadPlace: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
    },
    placeName: {
        fontSize: 15,
        color: '#333',
        marginBottom: 5,
    },
    placeAddress: {
        fontSize: 14,
        color: '#666',
    },
    blockSection: {
        flexDirection: 'column',
        alignItems: 'stretch',
    },
    imageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 2,
    },
    thumbnail: {
        width: 40,
        height: 40,
        marginRight: 10,
        marginBottom: 10,
        borderRadius: 4,
    },
    noImageText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        padding: 20,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    requiredStar: {
        color: '#ff4d4f',
        marginRight: 4,
        fontSize: 14,
    },
    sectionError: {
        borderWidth: 1,
        borderColor: '#ff4d4f',
        borderRadius: 4,
        marginHorizontal: 10,
        marginVertical: 5,
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ff4d4f',
    },
    bottomButtonsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#eee',
        // 添加阴影效果
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    bottomButtons: {
        flexDirection: 'row',
        padding: 15,
        paddingBottom: 15, // 增加底部内边距
    },
    button: {
        height: 44,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    prevButton: {
        flex: 1,
        marginRight: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#1892e5',
    },
    confirmButton: {
        flex: 2,
        backgroundColor: '#1892e5',
    },
    buttonWithPrev: {
        flex: 2,  // 当有"上一步"按钮时，确认按钮占据更多空间
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    prevButtonText: {
        color: '#1892e5',
        fontSize: 16,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    dialogScroll: {
        maxHeight: 550,
        paddingHorizontal: 15,
    },
    dialogText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 10,
    },
    dialogTitle: {
        color: '#333',
        fontWeight: 'bold',
        marginTop: 10,
    },
    checkboxContainer: {
        padding: 5,
    },
    tipsText: {
        color: '#1989fa',
        fontWeight: 'bold',
    },
    contractButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    arrowIcon: {
        marginLeft: 4,
    },
    stepsContainer: {
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 40,
    },
    stepsLine: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleActive: {
        backgroundColor: '#1892e5',
        borderColor: '#1892e5',
    },
    stepNumber: {
        fontSize: 14,
        color: '#999',
    },
    stepNumberActive: {
        color: '#fff',
    },
    line: {
        height: 1,
        backgroundColor: '#ddd',
        flex: 1,
        marginHorizontal: 8,
    },
    lineActive: {
        backgroundColor: '#1892e5',
    },
    safetyImage: {
        width: Dimensions.get('window').width,  // 使用屏幕宽度
        aspectRatio: 1.5,  // 设置宽高比，可以根据实际图片调整
        resizeMode: 'contain',  // 保持图片比例
        marginBottom: 15,  // 底部间距
    },
    headerRightButton: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
}); 