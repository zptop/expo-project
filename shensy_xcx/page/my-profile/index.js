import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image 
} from 'react-native';
import { Steps } from '../../components/Steps';
import ImagePicker from '../../components/ImagePicker';
import request from '../../util/request';
import toast from '../../util/toast';

export default function MyProfile({ route, navigation }) {
  const [activeStep, setActiveStep] = useState(0);
  const [uploading, setUploading] = useState(false);
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
    { text: '个人信息' },
    { text: '车辆信息' }
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

  // 修改图片字段映射
  const mapData = new Map([
    [0, 'icon_small'],
    [1, 'id_pic1'],
    [2, 'id_pic2'],
    [3, 'driver_lic_pic'],
    [4, 'driver_lic_side_pic'],
    [5, 'qual_cert_pic']
  ]);

  // 处理图片上传
  const handleImageUpload = (file, index) => {
    const fieldName = mapData.get(index);
    if (fieldName) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: file.obs_url,  // 保存相对路径用于提交
        [`${fieldName}_full`]: file.obs_url_text  // 保存完整路径用于显示
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

    // 身份证号码验证
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
      console.error('提交失败:', error);
      toast.show('提交失败');
    }
  };

  useEffect(() => {
    if (route.params?.real_name_flag === 3) {
      getUserIdentify();
    }
  }, [route.params]);

  return (
    <ScrollView style={styles.container}>
      <Steps steps={steps} activeStep={activeStep} />
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="请输入姓名"
          value={formData.real_name}
          onChangeText={v => setFormData(prev => ({ ...prev, real_name: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="请输入身份证号"
          value={formData.id_card_no}
          onChangeText={v => setFormData(prev => ({ ...prev, id_card_no: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="请输入银行卡号"
          value={formData.bank_card_no}
          onChangeText={v => setFormData(prev => ({ ...prev, bank_card_no: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="请输入开户银行"
          value={formData.bank_name}
          onChangeText={v => setFormData(prev => ({ ...prev, bank_name: v }))}
        />

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

        <TouchableOpacity 
          style={[styles.submitBtn, uploading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>下一步</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  form: {
    padding: 15
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginBottom: 15
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
  submitBtn: {
    backgroundColor: '#1890ff',
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc'
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  }
}); 