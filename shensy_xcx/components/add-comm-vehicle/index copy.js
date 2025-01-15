import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  SafeAreaView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Dialog from '../Dialog';
import DatePicker from '../DatePicker';
import request from '../../util/request';
import toast from '../../util/toast';
import ImagePicker from '../ImagePicker';

// 添加图片字段映射
const mapVehicleData = new Map([
  [0, 'vehicle_policy'], // 车头商业保险单
  [1, 'driving_lic_pic'], // 行驶证正页
  [2, 'driving_lic_side_pic'], // 行驶证年审页
  [3, 'road_trans_cert_pic'], // 营运证年审页
  [4, 'trailer_driving_lic_pic'], // 挂车行驶证正页
  [5, 'trailer_driving_lic_side_pic'], // 挂车行驶证年审页
  [6, 'trailer_road_trans_cert_pic'], // 挂车营运证年审页
  [7, 'man_vehicle_pic'], // 人车合照
]);

const AddCommVehicle = ({ user_vehicleid = '', flag = 'addvehicle', onSubmit }) => {
  const [vehicleInfo, setVehicleInfo] = useState({});
  const [isDisabled, setIsDisabled] = useState(false);
  const [currentSelectType, setCurrentSelectType] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [settlementVisible, setSettlementVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [settleList, setSettleList] = useState([]);
  const [selectedSettle, setSelectedSettle] = useState(null);

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

  // 图片上传处理
  const handleImageUpload = async (file, index) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: 'image/jpeg',
        name: 'image.jpg'
      });

      const res = await request.post('/app_driver/common/upload', formData, true);
      if (res.code === 0) {
        const field = mapVehicleData.get(index);
        setVehicleInfo(prev => ({
          ...prev,
          [field]: res.data.url
        }));
      } else {
        toast.show(res.msg || '上传失败');
      }
    } catch (error) {
      toast.show('上传失败');
    }
  };

  // 图片删除处理
  const handleImageDelete = (index) => {
    const field = mapVehicleData.get(index);
    setVehicleInfo(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  // 获取车辆详情
  const getVehicleDetail = async () => {
    try {
      const res = await request.get('/app_driver/vehicle/getVehicleInfo', {
        user_vehicleid
      });
      if (res.code === 0) {
        setVehicleInfo(res.data);
        setIsDisabled(flag === 'detail');
      } else {
        toast.show(res.msg || '获取车辆信息失败');
      }
    } catch (error) {
      toast.show('获取车辆信息失败');
    }
  };

  // 获取结算方式列表
  const getSettlementList = async (keyword = '') => {
    try {
      const res = await request.get('/app_driver/settle/getList', {
        keyword,
        page: 1,
        pageSize: 100
      });
      if (res.code === 0) {
        setSettleList(res.data.list || []);
      } else {
        toast.show(res.msg || '获取结算方式失败');
      }
    } catch (error) {
      toast.show('获取结算方式失败');
    }
  };

  // 选择结算方式
  const handleSelectSettle = (item) => {
    setSelectedSettle(item);
    setVehicleInfo(prev => ({
      ...prev,
      settle_method: item.settle_method,
      settle_name: item.settle_name
    }));
    setSettlementVisible(false);
  };

  // 渲染结算方式选择弹窗
  const renderSettlementModal = () => (
    <Modal
      visible={settlementVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setSettlementVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.settlementContainer}>
          <View style={styles.settlementHeader}>
            <Text style={styles.settlementTitle}>选择结算方式</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSettlementVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="请输入关键字搜索"
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={() => getSettlementList(searchText)}
            >
              <Text style={styles.searchBtnText}>搜索</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.settleList}>
            {settleList.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.settleRow,
                  selectedSettle?.settle_method === item.settle_method && styles.settleItemSelected
                ]}
                onPress={() => handleSelectSettle(item)}
              >
                <View style={styles.settleInfo}>
                  <Text style={styles.selectTitle}>{item.settle_name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  useEffect(() => {
    if (user_vehicleid) {
      getVehicleDetail();
    }
  }, [user_vehicleid]);

  // 在 useEffect 中添加获取结算方式列表
  useEffect(() => {
    getSettlementList();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 车头商业保险单 */}
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
              onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, vehicle_number: text }))}
              placeholder="请输入车牌号"
              editable={!isDisabled}
            />
          </View>
        </View>

        {/* 业务类型 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>业务类型</Text>
          </View>
          <View style={styles.inputRight}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                setCurrentSelectType('carrier_type');
                setDialogVisible(true);
              }}
              disabled={isDisabled}
            >
              <Text style={[styles.selectText, isDisabled && styles.readOnlyInput]}>
                {vehicleInfo.carrier_type_name || "请选择业务类型"}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 结算方式 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>结算方式</Text>
          </View>
          <View style={styles.inputRight}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setSettlementVisible(true)}
              disabled={isDisabled}
            >
              <Text style={[styles.selectText, isDisabled && styles.readOnlyInput]}>
                {vehicleInfo.settle_name || "请选择结算方式"}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

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
              onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, road_trans_cert_number: text }))}
              placeholder="请输入道路运输证号"
              editable={!isDisabled}
            />
          </View>
        </View>

        {/* 车型 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>车型</Text>
          </View>
          <View style={styles.inputRight}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                setCurrentSelectType('vehicle_type');
                setDialogVisible(true);
              }}
              disabled={isDisabled}
            >
              <Text style={[styles.selectText, isDisabled && styles.readOnlyInput]}>
                {vehicleInfo.vehicle_type_name || "请选择车型"}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 车长 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>车长</Text>
          </View>
          <View style={styles.inputRight}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                setCurrentSelectType('vehicle_length_type');
                setDialogVisible(true);
              }}
              disabled={isDisabled}
            >
              <Text style={[styles.selectText, isDisabled && styles.readOnlyInput]}>
                {vehicleInfo.vehicle_length_type_name || "请选择车长"}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 整备质量 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>整备质量(kg)</Text>
          </View>
          <View style={styles.inputRight}>
            <TextInput
              style={[styles.input, isDisabled && styles.readOnlyInput]}
              value={vehicleInfo.vehicle_laden_weight}
              onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, vehicle_laden_weight: text }))}
              placeholder="请输入整备质量"
              keyboardType="numeric"
              editable={!isDisabled}
            />
          </View>
        </View>

        {/* 核定载质量 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>核定载质量(kg)</Text>
          </View>
          <View style={styles.inputRight}>
            <TextInput
              style={[styles.input, isDisabled && styles.readOnlyInput]}
              value={vehicleInfo.vehicle_tonnage}
              onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, vehicle_tonnage: text }))}
              placeholder="请输入核定载质量"
              keyboardType="numeric"
              editable={!isDisabled}
            />
          </View>
        </View>

        {/* 牌照类型 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>牌照类型</Text>
          </View>
          <View style={styles.inputRight}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                setCurrentSelectType('lic_plate_code');
                setDialogVisible(true);
              }}
              disabled={isDisabled}
            >
              <Text style={[styles.selectText, isDisabled && styles.readOnlyInput]}>
                {vehicleInfo.lic_plate_name || "请选择牌照类型"}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 车辆分类 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>车辆分类</Text>
          </View>
          <View style={styles.inputRight}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                setCurrentSelectType('vehicle_class_code');
                setDialogVisible(true);
              }}
              disabled={isDisabled}
            >
              <Text style={[styles.selectText, isDisabled && styles.readOnlyInput]}>
                {vehicleInfo.vehicle_class_name || "请选择车辆分类"}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 车辆颜色 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>车辆颜色</Text>
          </View>
          <View style={styles.inputRight}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                setCurrentSelectType('vehicle_plate_color');
                setDialogVisible(true);
              }}
              disabled={isDisabled}
            >
              <Text style={[styles.selectText, isDisabled && styles.readOnlyInput]}>
                {vehicleInfo.vehicle_plate_color_name || "请选择车辆颜色"}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 车辆品牌 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>车辆品牌</Text>
          </View>
          <View style={styles.inputRight}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                setCurrentSelectType('vehicle_brands');
                setDialogVisible(true);
              }}
              disabled={isDisabled}
            >
              <Text style={[styles.selectText, isDisabled && styles.readOnlyInput]}>
                {vehicleInfo.vehicle_brands_name || "请选择车辆品牌"}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 注册车辆（牵引车）行驶证正页 */}
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
                source={require('../../assets/shensy_driver_xcx_images/vehicle-f-2-1.png')}
                style={styles.exampleImage}
              />
              <View style={styles.exampleLabel}>
                <Text style={styles.exampleText}>示例</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 注册车辆（牵引车）行驶证年审页 */}
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
                source={require('../../assets/shensy_driver_xcx_images/vehicle-f-2-2.png')}
                style={styles.exampleImage}
              />
              <View style={styles.exampleLabel}>
                <Text style={styles.exampleText}>示例</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 牵引车车辆年检过期日期 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>牵引车车辆年检过期日期</Text>
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
          {renderDatePicker('vehicle_annual_inspect_exp', '牵引车车辆年检过期日期')}
        </View>

        {/* 注册车辆（牵引车）营运证年审页 */}
        <View style={styles.uploadGroup}>
          <View style={styles.uploadLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.uploadTitle}>注册车辆（牵引车）营运证年审页</Text>
          </View>
          <View style={styles.uploadContent}>
            <ImagePicker
              files={vehicleInfo.road_trans_cert_pic ? [{
                url: vehicleInfo.road_trans_cert_pic
              }] : []}
              onUpload={(file) => handleImageUpload(file, 3)}
              onDelete={() => handleImageDelete(3)}
              showDelete={!isDisabled && !!vehicleInfo.road_trans_cert_pic}
              disabled={isDisabled}
            />
            <View style={styles.exampleContainer}>
              <Image
                source={require('../../assets/shensy_driver_xcx_images/vehicle-f-3.png')}
                style={styles.exampleImage}
              />
              <View style={styles.exampleLabel}>
                <Text style={styles.exampleText}>示例</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 牵引车营运证年审过期日期 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>牵引车营运证年审过期日期</Text>
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
          {renderDatePicker('vehicle_annual_audit_exp', '牵引车营运证年审过期日期')}
        </View>

        {/* 注册车辆（挂车）行驶证年审页 */}
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
              onUpload={(file) => handleImageUpload(file, 5)}
              onDelete={() => handleImageDelete(5)}
              showDelete={!isDisabled && !!vehicleInfo.trailer_driving_lic_side_pic}
              disabled={isDisabled}
            />
            <View style={styles.exampleContainer}>
              <Image
                source={require('../../assets/shensy_driver_xcx_images/vehicle-f-2-2.png')}
                style={styles.exampleImage}
              />
              <View style={styles.exampleLabel}>
                <Text style={styles.exampleText}>示例</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 挂车车辆年检过期日期 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>挂车车辆年检过期日期</Text>
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
          {renderDatePicker('trailer_annual_inspect_exp', '挂车车辆年检过期日期')}
        </View>

        {/* 注册车辆（挂车）营运证年审页 */}
        <View style={styles.uploadGroup}>
          <View style={styles.uploadLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.uploadTitle}>注册车辆（挂车）营运证年审页</Text>
          </View>
          <View style={styles.uploadContent}>
            <ImagePicker
              files={vehicleInfo.trailer_road_trans_cert_pic ? [{
                url: vehicleInfo.trailer_road_trans_cert_pic
              }] : []}
              onUpload={(file) => handleImageUpload(file, 6)}
              onDelete={() => handleImageDelete(6)}
              showDelete={!isDisabled && !!vehicleInfo.trailer_road_trans_cert_pic}
              disabled={isDisabled}
            />
            <View style={styles.exampleContainer}>
              <Image
                source={require('../../assets/shensy_driver_xcx_images/vehicle-f-3.png')}
                style={styles.exampleImage}
              />
              <View style={styles.exampleLabel}>
                <Text style={styles.exampleText}>示例</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 挂车营运证年审过期日期 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLeft}>
            <Text style={styles.required}>*</Text>
            <Text style={styles.inputLabel}>挂车营运证年审过期日期</Text>
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
          {renderDatePicker('trailer_annual_audit_exp', '挂车营运证年审过期日期')}
        </View>

        {/* 人车合照 */}
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
              onUpload={(file) => handleImageUpload(file, 7)}
              onDelete={() => handleImageDelete(7)}
              showDelete={!isDisabled && !!vehicleInfo.man_vehicle_pic}
              disabled={isDisabled}
            />
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
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

      {/* 弹窗组件 */}
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
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  inputLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  inputRight: {
    flex: 1,
    flexDirection: 'row',
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
  selectValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 180,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingLeft: 5,
  },
  required: {
    color: '#ff4d4f',
    marginRight: 2,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
  },
  requiredStar: {
    color: '#ff4d4f',
    marginRight: 2,
    color: '#333',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#333',
  },
  value: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  bottomSafeArea: {
    backgroundColor: '#fff'
  },
  bottomBtnContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    marginLeft: 10,
    marginRight: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  settlementContainer: {
    flex: 1,
    backgroundColor: '#fff',
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
});

export default AddCommVehicle;

