import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { Steps } from '../../components/Steps';
import request from '../../util/request';
import toast from '../../util/toast';

export default function MyProfile({ route, navigation }) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    real_name: '',
    id_card_no: '',
    bank_card_no: '',
    bank_name: '',
    referral_employee_id: '',
    // ... 其他表单字段
  });

  const steps = [
    { text: '个人信息' },
    { text: '车辆信息' }
  ];

  // 表单提交
  const handleSubmit = async () => {
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
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Steps steps={steps} activeStep={activeStep} />
      {/* 表单内容 */}
      {/* ... */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  }
  // ... 其他样式
}); 