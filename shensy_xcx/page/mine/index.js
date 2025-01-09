import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import request from '../../util/request';
import toast from '../../util/toast';

export default function Mine({ navigation }) {
  const [userInfo, setUserInfo] = useState({
    real_name_flag: 0, // 认证状态 0没提交 1认证中 2已认证 3认证不通过
    real_name: 'deepin123456',
    vehicle_number: '',
    vehicle_length_type_desc: '',
    vehicle_type_desc: '',
    is_ca_audit: 0,
    total_transporting: 0
  });
  const [is_agent_flag, setIs_agent_flag] = useState(0);  // 是否签署代征协议 1是 0否
  const [is_jiangsu_flag, setIs_jiangsu_flag] = useState(0); // 是否江苏税务实名 1是 0否

  // 导航菜单配置
  const navArr = [
    {
      name: '我的运输单',
      icon: require('../../assets/shensy_driver_xcx_images/mine-icon-1.png'),
      route: 'Waybill'
    },
    {
      name: '车辆管理',
      icon: require('../../assets/shensy_driver_xcx_images/mine-icon-2.png'),
      route: 'VehicleManagement'
    },
    {
      name: '设置',
      icon: require('../../assets/shensy_driver_xcx_images/mine-icon-3.png'),
      route: 'Settings'
    }
  ];

  // 获取用户状态
  const getUserStatus = async () => {
    try {
      const res = await request.get('/app_driver/user/getUserStatus');
      if (res.code === 0) {
        setIs_agent_flag(res.data.is_agent_flag);
        setIs_jiangsu_flag(res.data.is_jiangsu_flag);
      }
    } catch (error) {
      console.error('获取用户状态失败:', error);
    }
  };

  // 获取用户信息
  const getMyUserInfo = async () => {
    try {
      const res = await request.get('/app_driver/user/getUserInfo');
      if (res.code === 0) {
        setUserInfo(res.data.userInfo);
      } else {
        toast.show(res.msg);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  useEffect(() => {
    getMyUserInfo();
    getUserStatus();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 用户信息区域 */}
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => navigation.navigate(
            userInfo.real_name_flag === 0 ? 'MyProfile' : 'MyProfileDetail', 
            { real_name_flag: userInfo.real_name_flag }
          )}
        >
          <View style={styles.avatar}>
            <Image source={{ uri: userInfo.icon_small_desc }} style={{ width: 60, height: 60 }} />
          </View>
          <View style={styles.userDetail}>
            <Text style={styles.userName}>{userInfo.real_name}</Text>
            <View style={styles.statusTags}>
              {/* 认证状态标签 */}
              <View style={[styles.tag, getAuthStatusStyle(userInfo.real_name_flag)]}>
                <Text style={styles.tagText}>
                  {getAuthStatusText(userInfo.real_name_flag)}
                </Text>
              </View>
              {/* CA认证标签 */}
              <View style={[styles.tag, styles.caTag]}>
                <Text style={styles.tagText}>
                  {userInfo.is_ca_audit === 1 ? 'CA认证成功' : '未CA认证'}
                </Text>
              </View>
              {/* 税务标签 */}
              <View style={[styles.tag, is_jiangsu_flag === 1 ? styles.taxTagActive : styles.taxTag]}>
                <Text style={styles.tagText}>税</Text>
              </View>
              {/* 征收标签 */}
              <View style={[styles.tag, is_agent_flag === 1 ? styles.taxTagActive : styles.taxTag]}>
                <Text style={styles.tagText}>征</Text>
              </View>
            </View>
            {/* 车辆信息 */}
            {userInfo.vehicle_number && (
              <Text style={styles.vehicleInfo}>
                {`${userInfo.vehicle_number}/${userInfo.vehicle_length_type_desc}/${userInfo.vehicle_type_desc}`}
              </Text>
            )}
          </View>
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={24} 
            color="#999"
          />
        </TouchableOpacity>

        {/* 导航菜单 */}
        <View style={styles.navGrid}>
          {navArr.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.navItem,
                index % 2 === 1 && styles.navItemLast
              ]}
              onPress={() => navigation.navigate(item.route)}
            >
              <Image source={item.icon} style={styles.navIcon} />
              <Text style={styles.navText}>{item.name}</Text>
              {/* 运输中数量标签 */}
              {index === 0 && userInfo.total_transporting > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {userInfo.total_transporting}
                    <Text style={styles.badgeSubText}>运输中</Text>
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 获取认证状态样式
const getAuthStatusStyle = (status) => {
  switch (status) {
    case 0: return styles.notAuth;
    case 1: return styles.authIng;
    case 2: return styles.authed;
    case 3: return styles.authFail;
    default: return styles.notAuth;
  }
};

// 获取认证状态文本
const getAuthStatusText = (status) => {
  switch (status) {
    case 0: return '未认证';
    case 1: return '认证中';
    case 2: return '已实名认证';
    case 3: return '认证失败';
    default: return '未认证';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F7',
  },
  userInfo: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  userDetail: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  statusTags: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 8,
  },
  notAuth: {
    backgroundColor: '#FFF0F0',
  },
  authIng: {
    backgroundColor: '#E6F7FF',
  },
  authed: {
    backgroundColor: '#F0F9EB',
  },
  authFail: {
    backgroundColor: '#FFF0F0',
  },
  caTag: {
    backgroundColor: '#F0F9EB',
  },
  taxTag: {
    backgroundColor: '#F5F5F5',
  },
  taxTagActive: {
    backgroundColor: '#E6F7FF',
  },
  tagText: {
    fontSize: 12,
    color: '#67C23A',
  },
  vehicleInfo: {
    fontSize: 12,
    color: '#666',
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    marginTop: 10,
  },
  navItem: {
    width: '50%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#eee',
  },
  navItemLast: {
    borderRightWidth: 0,
  },
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: 12,
  },
  navText: {
    fontSize: 14,
    color: '#333',
  },
  badge: {
    position: 'absolute',
    top: 35,
    right: '20%',
    backgroundColor: '#FF0000',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
  },
  badgeSubText: {
    fontSize: 10,
  },
}); 