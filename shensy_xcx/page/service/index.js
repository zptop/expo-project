import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Service() {
  return (
    <View style={styles.container}>
      <Text>服务页面</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 