import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform,SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import globalData from '../../util/globalData';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Settings({ navigation }) {
  // 退出登录
  const handleLogout = () => {
    Alert.alert(
      '退出',
      '确定退出登录？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '确定',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('退出登录失败:', error);
            }
          }
        }
      ]
    );
  };

  // 基本设置菜单项
  const basicMenuItems = [
    {
      title: '当前版本',
      value: globalData.version,
      showArrow: false
    },
    {
      title: '版权所有',
      route: 'Copyright',
      showArrow: true
    }
  ];

  // 渲染菜单项
  const renderMenuItem = (item, index, isLast) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.menuItem,
        isLast && styles.lastMenuItem
      ]}
      onPress={() => item.route && navigation.navigate(item.route)}
    >
      <Text style={styles.menuText}>{item.title}</Text>
      <View style={styles.rightContent}>
        {item.value && (
          <Text style={styles.valueText}>{item.value}</Text>
        )}
        {item.showArrow && (
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={20} 
            color="#999" 
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 基本设置 */}
      <View style={styles.menuGroup}>
        {basicMenuItems.map((item, index) => 
          renderMenuItem(item, index, index === basicMenuItems.length - 1)
        )}
      </View>

      {/* 退出登录按钮 */}
      <SafeAreaView style={styles.logoutContainer}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>退出</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  menuGroup: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 14,
    color: '#333',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    color: '#999',
    marginRight: 5,
  },
  logoutContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 0 : 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  logoutButton: {
    height: 44,
    backgroundColor: '#1890FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 