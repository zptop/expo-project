import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';

const tabConfig = [
  {
    key: 'CommonLines',
    title: '常用线路',
    icon: require('../../assets/shensy_driver_xcx_images/common-lines.png'),
    activeIcon: require('../../assets/shensy_driver_xcx_images/common-lines-checked.png'),
  },
  {
    key: 'Goods',
    title: '货源',
    icon: require('../../assets/shensy_driver_xcx_images/goods.png'),
    activeIcon: require('../../assets/shensy_driver_xcx_images/goods-checked.png'),
  },
  {
    key: 'Waybill',
    title: '我的运输单',
    icon: require('../../assets/shensy_driver_xcx_images/yd_nochecked.png'),
    activeIcon: require('../../assets/shensy_driver_xcx_images/yd_checked.png'),
  },
  {
    key: 'Service',
    title: '服务',
    icon: require('../../assets/shensy_driver_xcx_images/service.png'),
    activeIcon: require('../../assets/shensy_driver_xcx_images/service-checked.png'),
  },
  {
    key: 'Mine',
    title: '我的',
    icon: require('../../assets/shensy_driver_xcx_images/mine.png'),
    activeIcon: require('../../assets/shensy_driver_xcx_images/mine-checked.png'),
  },
];

export default function TabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      {tabConfig.map((tab, index) => {
        const isFocused = state.index === index;
        
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: tab.key,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.key);
          }
        };

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={onPress}
          >
            <Image
              source={isFocused ? tab.activeIcon : tab.icon}
              style={styles.icon}
            />
            <Text style={[
              styles.label,
              isFocused && styles.labelFocused
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // iOS底部安全区域
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  labelFocused: {
    color: '#003B90',
  },
}); 