import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView
} from 'react-native';
import { Steps } from '../../components/Steps';
import ImagePicker from '../../components/ImagePicker';
import Dialog from '../../components/Dialog';
import AddCommVehicle from '../../components/add-comm-vehicle';
import request from '../../util/request';
import toast from '../../util/toast';

// 图片字段映射
const mapData = new Map([
  [0, 'icon_small'],
  [1, 'id_pic1'],
  [2, 'id_pic2'],
  [3, 'driver_lic_pic'],
  [4, 'driver_lic_side_pic'],
  [5, 'qual_cert_pic']
]);

export default function MyProfile({ route, navigation }) {
  const [activeStep, setActiveStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [referralList, setReferralList] = useState([]);
  const [formData, setFormData] = useState({
    real_name: '',
    id_card_no: '',
    bank_card_no: '',
    bank_name: '',
    referral_employee_id: '',
    icon_small: '',
    id_pic1: '',
    id_pic2: '',
    driver_lic_pic: '',
    driver_lic_side_pic: '',
    qual_cert_pic: ''
  });

  const steps = [
    { text: '人', completed: activeStep >= 1 },
    { text: '车', completed: activeStep >= 1 }
  ];

  // 获取用户认证信息
  const getUserIdentify = async () => {
    try {
      const res = await request.get('/app_driver/user/getUserIdentify');
      if (res.code === 0) {
        setFormData(res.data);
      } else {
        toast.show(res.msg);
      }
    } catch (error) {
      console.error('获取用户认证信息失败:', error);
    }
  };

  // 处理图片上传
  const handleImageUpload = (file, index) => {
    const fieldName = mapData.get(index);
    if (fieldName) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: file.obs_url,
        [`${fieldName}_full`]: file.obs_url_text
      }));
    }
  };

  // 处理图片删除
  const handleImageDelete = (index) => {
    const fieldName = mapData.get(index);
    if (fieldName) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: '',
        [`${fieldName}_full`]: ''
      }));
    }
  };

  // 表单验证
  const validateForm = () => {
    const requiredFields = {
      real_name: '请输入姓名',
      id_card_no: '请输入身份证号',
      bank_card_no: '请输入银行卡号',
      bank_name: '请输入开户银行',
      icon_small: '请上传您本人肩部以上五官清晰头像照',
      id_pic1: '请上传您本人身份证头像照',
      id_pic2: '请上传您本人身份证国徽照',
      driver_lic_pic: '请上传您本人驾驶证正页',
      driver_lic_side_pic: '请上传您本人驾驶证副页',
      qual_cert_pic: '请上传您本人从业资格证'
    };

    for (const [field, message] of Object.entries(requiredFields)) {
      if (!formData[field]) {
        toast.show(message);
        return false;
      }
    }

    const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    if (!idCardReg.test(formData.id_card_no)) {
      toast.show('身份证号码格式不正确');
      return false;
    }

    return true;
  };

  // 表单提交
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const res = await request.post('/app_driver/user/setUserInfo', formData);
      if (res.code === 0) {
        if (route.params?.real_name_flag !== 3) {
          setActiveStep(1);
        } else {
          toast.show('提交成功');
          navigation.goBack();
        }
      } else {
        navigation.navigate('AuthError', { errMsg: res.msg });
      }
    } catch (error) {
      toast.show('提交失败');
    }
  };

  // 获取推荐人列表
  const getUserReferral = async () => {
    try {
      const res = await request.get('/app_driver/user/getUserReferral');
      if (res.code === 0) {
        setReferralList(res.data || []);
      } else {
        toast.show(res.msg);
      }
    } catch (error) {
      toast.show('获取推荐人列表失败');
    }
  };

  // 处理推荐人选择
  const handleReferralSelect = (label, value) => {
    setFormData(prev => ({
      ...prev,
      referral_employee_id: value
    }));
    setDialogVisible(false);
  };

  // 在组件加载时获取推荐人列表
  useEffect(() => {
    getUserReferral();
  }, []);

  // 将推荐人列表转换为 Dialog 需要的格式
  const getReferralOptions = () => {
    return referralList.map(item => ({
      label: item.referral_code,  // 显示的文本
      value: item.referral_employee_id  // 实际的值
    }));
  };

  useEffect(() => {
    if (route.params?.real_name_flag === 3) {
      getUserIdentify();
    }
  }, [route.params]);

  // 处理车辆信息提交
  const handleVehicleSubmit = async (vehicleData) => {
    try {
      const res = await request.post('/app_driver/vehicle/addVehicle', vehicleData);
      if (res.code === 0) {
        toast.show('提交成功');
        navigation.goBack();
      } else {
        toast.show(res.msg);
      }
    } catch (error) {
      toast.show('提交失败');
    }
  };

  // 渲染内容
  const renderContent = () => {
    if (activeStep === 0) {
      return (
        <View style={styles.form}>
          {/* 姓名 */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLeft}>
              <Text style={styles.required}>*</Text>
              <Text style={styles.inputLabel}>姓名</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="请输入姓名"
              value={formData.real_name}
              onChangeText={v => setFormData(prev => ({ ...prev, real_name: v }))}
            />
          </View>

          {/* 身份证号 */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLeft}>
              <Text style={styles.required}>*</Text>
              <Text style={styles.inputLabel}>身份证号</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="请输入身份证号"
              value={formData.id_card_no}
              onChangeText={v => setFormData(prev => ({ ...prev, id_card_no: v }))}
            />
          </View>

          {/* 银行卡号 */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLeft}>
              <Text style={styles.required}>*</Text>
              <Text style={styles.inputLabel}>银行卡号</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="请输入银行卡号"
              value={formData.bank_card_no}
              onChangeText={v => setFormData(prev => ({ ...prev, bank_card_no: v }))}
            />
          </View>

          {/* 开户银行 */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLeft}>
              <Text style={styles.required}>*</Text>
              <Text style={styles.inputLabel}>开户银行</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="请输入开户银行"
              value={formData.bank_name}
              onChangeText={v => setFormData(prev => ({ ...prev, bank_name: v }))}
            />
          </View>

          {/* 头像 */}
          <View style={styles.uploadGroup}>
            <View style={styles.uploadLeft}>
              <Text style={styles.required}>*</Text>
              <Text style={styles.uploadTitle}>请上传您本人肩部以上五官清晰头像照</Text>
            </View>
            <View style={styles.uploadContent}>
              <ImagePicker
                files={formData.icon_small ? [{
                  url: formData.icon_small_full || formData.icon_small
                }] : []}
                onUpload={(file) => handleImageUpload(file, 0)}
                onDelete={() => handleImageDelete(0)}
                showDelete={!!formData.icon_small}
              />
              <View style={styles.exampleContainer}>
                <Image
                  source={require('../../assets/shensy_driver_xcx_images/f-1.png')}
                  style={styles.exampleImage}
                />
                <View style={styles.exampleLabel}>
                  <Text style={styles.exampleText}>示例</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 身份证头像照 */}
          <View style={styles.uploadGroup}>
            <View style={styles.uploadLeft}>
              <Text style={styles.required}>*</Text>
              <Text style={styles.uploadTitle}>请上传您本人身份证头像照</Text>
            </View>
            <View style={styles.uploadContent}>
              <ImagePicker
                files={formData.id_pic1 ? [{
                  url: formData.id_pic1_full || formData.id_pic1
                }] : []}
                onUpload={(file) => handleImageUpload(file, 1)}
                onDelete={() => handleImageDelete(1)}
                showDelete={!!formData.id_pic1}
              />
              <View style={styles.exampleContainer}>
                <Image
                  source={require('../../assets/shensy_driver_xcx_images/f-2.png')}
                  style={styles.exampleImage}
                />
                <View style={styles.exampleLabel}>
                  <Text style={styles.exampleText}>示例</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 身份证国徽照 */}
          <View style={styles.uploadGroup}>
            <View style={styles.uploadLeft}>
              <Text style={styles.required}>*</Text>
              <Text style={styles.uploadTitle}>请上传您本人身份证国徽照</Text>
            </View>
            <View style={styles.uploadContent}>
              <ImagePicker
                files={formData.id_pic2 ? [{
                  url: formData.id_pic2_full || formData.id_pic2
                }] : []}
                onUpload={(file) => handleImageUpload(file, 2)}
                onDelete={() => handleImageDelete(2)}
                showDelete={!!formData.id_pic2}
              />
              <View style={styles.exampleContainer}>
                <Image
                  source={require('../../assets/shensy_driver_xcx_images/f-3.png')}
                  style={styles.exampleImage}
                />
                <View style={styles.exampleLabel}>
                  <Text style={styles.exampleText}>示例</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 驾驶证正页 */}
          <View style={styles.uploadGroup}>
            <View style={styles.uploadLeft}>
              <Text style={styles.required}>*</Text>
              <Text style={styles.uploadTitle}>请上传您本人驾驶证正页</Text>
            </View>
            <View style={styles.uploadContent}>
              <ImagePicker
                files={formData.driver_lic_pic ? [{
                  url: formData.driver_lic_pic_full || formData.driver_lic_pic
                }] : []}
                onUpload={(file) => handleImageUpload(file, 3)}
                onDelete={() => handleImageDelete(3)}
                showDelete={!!formData.driver_lic_pic}
              />
              <View style={styles.exampleContainer}>
                <Image
                  source={require('../../assets/shensy_driver_xcx_images/f-4.png')}
                  style={styles.exampleImage}
                />
                <View style={styles.exampleLabel}>
                  <Text style={styles.exampleText}>示例</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 驾驶证副页 */}
          <View style={styles.uploadGroup}>
            <View style={styles.uploadLeft}>
              <Text style={styles.required}>*</Text>
              <Text style={styles.uploadTitle}>请上传您本人驾驶证副页</Text>
            </View>
            <View style={styles.uploadContent}>
              <ImagePicker
                files={formData.driver_lic_side_pic ? [{
                  url: formData.driver_lic_side_pic_full || formData.driver_lic_side_pic
                }] : []}
                onUpload={(file) => handleImageUpload(file, 4)}
                onDelete={() => handleImageDelete(4)}
                showDelete={!!formData.driver_lic_side_pic}
              />
              <View style={styles.exampleContainer}>
                <Image
                  source={require('../../assets/shensy_driver_xcx_images/f-4.png')}
                  style={styles.exampleImage}
                />
                <View style={styles.exampleLabel}>
                  <Text style={styles.exampleText}>示例</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 从业资格证 */}
          <View style={styles.uploadGroup}>
            <View style={styles.uploadLeft}>
              <Text style={styles.required}>*</Text>
              <Text style={styles.uploadTitle}>请上传您本人从业资格证</Text>
            </View>
            <View style={styles.uploadContent}>
              <ImagePicker
                files={formData.qual_cert_pic ? [{
                  url: formData.qual_cert_pic_full || formData.qual_cert_pic
                }] : []}
                onUpload={(file) => handleImageUpload(file, 5)}
                onDelete={() => handleImageDelete(5)}
                showDelete={!!formData.qual_cert_pic}
              />
              <View style={styles.exampleContainer}>
                <Image
                  source={require('../../assets/shensy_driver_xcx_images/f-5.jpg')}
                  style={styles.exampleImage}
                />
                <View style={styles.exampleLabel}>
                  <Text style={styles.exampleText}>示例</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    } else {
      return (
        <AddCommVehicle
          flag="addvehicle"
          onSubmit={handleVehicleSubmit}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Steps 固定在顶部 */}
        {route.params?.real_name_flag !== 3 && (
          <View style={styles.stepsContainer}>
            <Steps steps={steps} activeStep={activeStep} />
          </View>
        )}

        {/* 内容区域 */}
        <ScrollView style={styles.scrollView}>
          {renderContent()}
        </ScrollView>

        {/* 底部按钮只在个人信息步骤显示 */}
        {activeStep === 0 && (
          <View style={styles.bottomBtnContainer}>
            <TouchableOpacity 
              style={[styles.submitBtn, uploading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {route.params?.real_name_flag !== 3 ? '下一步' : '提交'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 推荐人选择弹框 */}
        <Dialog
          visible={dialogVisible}
          title="选择推荐人"
          data={getReferralOptions()}
          onCancel={() => setDialogVisible(false)}
          onConfirm={handleReferralSelect}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1
  },
  stepsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff'
  },
  form: {
    padding: 15
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee'
  },
  inputLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80
  },
  required: {
    color: '#ff4d4f',
    marginRight: 2,
    fontSize: 14
  },
  inputLabel: {
    fontSize: 14,
    color: '#333'
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    paddingRight: 15
  },
  selectBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 40
  },
  selectText: {
    fontSize: 14,
    color: '#999'
  },
  selectArrow: {
    marginLeft: 5,
    fontSize: 16,
    color: '#999'
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
  submitBtnDisabled: {
    backgroundColor: '#ccc'
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  uploadGroup: {
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee'
  },
  uploadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  uploadTitle: {
    fontSize: 14,
    color: '#333'
  },
  uploadContent: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  exampleContainer: {
    position: 'relative',
    marginLeft: 10
  },
  exampleImage: {
    width: 73,
    height: 73,
    borderWidth: 1,
    borderColor: '#b2bab4',
    borderRadius: 4
  },
  exampleLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#b2bab4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomRightRadius: 10
  },
  exampleText: {
    color: '#fff',
    fontSize: 11
  }
}); 