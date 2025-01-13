import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input, Button } from '@ant-design/react-native';
import ImageUploader from '../../components/ImageUploader';
import { uploadFile } from '../../util/upload';

export default function IdentityForm({ formData, onSubmit, onPreview }) {
  const [form, setForm] = useState(formData);
  const [uploading, setUploading] = useState(false);

  const uploadFields = [
    {
      title: '请上传您本人肩部以上五官清晰头像照',
      field: 'icon_small',
      image: require('../../assets/shensy_driver_xcx_images/f-1.png')
    },
    {
      title: '请上传您本人身份证头像照',
      field: 'id_pic1',
      image: require('../../assets/shensy_driver_xcx_images/f-2.png')
    },
    {
      title: '请上传您本人身份证国徽照',
      field: 'id_pic2',
      image: require('../../assets/shensy_driver_xcx_images/f-3.png')
    },
    {
      title: '请上传您本人驾驶证正页',
      field: 'driver_lic_pic',
      image: require('../../assets/shensy_driver_xcx_images/f-4.png')
    },
    {
      title: '请上传您本人驾驶证副页', 
      field: 'driver_lic_side_pic',
      image: require('../../assets/shensy_driver_xcx_images/f-4.png')
    },
    {
      title: '请上传您本人从业资格证',
      field: 'qual_cert_pic',
      image: require('../../assets/shensy_driver_xcx_images/f-5.jpg')
    }
  ];

  // 处理图片上传
  const handleUpload = async (files, field) => {
    setUploading(true);
    try {
      const urls = await Promise.all(
        files.map(file => uploadFile(file))
      );
      setForm(prev => ({
        ...prev,
        [field]: urls.join(',')
      }));
    } catch (error) {
      console.error('上传失败:', error);
    }
    setUploading(false);
  };

  // 表单提交
  const handleSubmit = () => {
    if (!validateForm()) return;
    onSubmit(form);
  };

  // 表单验证
  const validateForm = () => {
    // 实现表单验证逻辑
    return true;
  };

  return (
    <View style={styles.form}>
      <Input
        placeholder="请输入姓名"
        value={form.real_name}
        onChange={v => setForm(prev => ({ ...prev, real_name: v }))}
      />
      <Input
        placeholder="请输入身份证号"
        value={form.id_card_no}
        onChange={v => setForm(prev => ({ ...prev, id_card_no: v }))}
      />
      <Input
        placeholder="请输入银行卡号"
        value={form.bank_card_no}
        onChange={v => setForm(prev => ({ ...prev, bank_card_no: v }))}
      />
      <Input
        placeholder="请输入开户银行"
        value={form.bank_name}
        onChange={v => setForm(prev => ({ ...prev, bank_name: v }))}
      />

      {uploadFields.map((field, index) => (
        <ImageUploader
          key={index}
          title={field.title}
          value={form[field.field]}
          onChange={files => handleUpload(files, field.field)}
          onPreview={onPreview}
          placeholder={field.image}
        />
      ))}

      <Button
        type="primary"
        onPress={handleSubmit}
        loading={uploading}
        style={styles.submitBtn}
      >
        下一步
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 15
  },
  submitBtn: {
    marginTop: 20
  }
}); 