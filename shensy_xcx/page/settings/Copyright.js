import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function Copyright() {
  return (
    <View style={styles.container}>
      <View style={styles.cell}>
        <View style={styles.titleContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/shensy_driver_xcx_images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>版权和专利</Text>
          <View style={styles.addInfo}>
            <Text style={styles.copyright}>
              Copyright © 上海申丝企业发展有限公司2018版权所有
            </Text>
          </View>
        </View>
        <Text style={styles.label}>
          专利信息请参见 www.shensy.com
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cell: {
    padding: 16,
    backgroundColor: '#fff',
  },
  titleContainer: {
    marginBottom: 8,
  },
  logoContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logo: {
    width: 160,
    height: 45,
  },
  title: {
    fontSize: 25,
    color: '#333',
    marginBottom: 12,
  },
  addInfo: {
    alignItems: 'flex-start',
  },
  copyright: {
    fontSize: 14,
    color: '#666',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
}); 