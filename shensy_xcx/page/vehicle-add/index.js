import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AddCommVehicle from '../../components/add-comm-vehicle';
import ImagePreview from '../../components/ImagePreview';
import request from '../../util/request';
import toast from '../../util/toast';

export default function VehicleAdd({ route, navigation }) {
  const { user_vehicleid = '', vehicle_number = '' } = route.params || {};
  const [previewImages, setPreviewImages] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // 处理图片预览
  const handlePreview = (images, index) => {
    setPreviewImages(images);
    setShowPreview(true);
  };

  // 处理表单提交
  const handleSubmit = async (data) => {
    try {
      const res = await request.post(
        user_vehicleid 
          ? '/app_driver/vehicle/editUserVehicle'
          : '/app_driver/vehicle/addUserVehicle',
        {
          ...data,
          user_vehicleid: user_vehicleid || undefined
        }
      );

      if (res.code === 0) {
        toast.show(user_vehicleid ? '修改成功' : '添加成功');
        navigation.goBack();
      } else {
        toast.show(res.msg);
      }
    } catch (error) {
      console.error(user_vehicleid ? '修改车辆失败:' : '添加车辆失败:', error);
    }
  };

  return (
    <View style={styles.container}>
      <AddCommVehicle
        user_vehicleid={user_vehicleid}
        flag="addvehicle"
        onSubmit={handleSubmit}
        onPreview={handlePreview}
      />
      <ImagePreview
        visible={showPreview}
        images={previewImages}
        onClose={() => setShowPreview(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
});
