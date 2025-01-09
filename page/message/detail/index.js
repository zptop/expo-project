import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator,
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import request from '../../../util/request';
import toast from '../../../util/toast';

export default function MessageDetail({ route, navigation }) {
  const { id } = route.params;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  // 获取消息详情
  const getMessageDetail = async () => {
    try {
      const res = await request.get('/app_driver/message/getDetail', {
        id
      });

      if (res.code === 0 && res.data) {
        setDetail(res.data);
      } else {
        toast.show(res.msg || '获取消息详情失败');
      }
    } catch (error) {
      toast.show(error.message || '获取消息详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMessageDetail();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1892e5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.messageHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="message" size={24} color="#333" />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.time, { color: '#323233',marginBottom:5 }]}>{detail?.subject}</Text>
              <Text style={styles.time}>{detail?.create_time_desc}</Text>
            </View>
          </View>
          <Text style={styles.message}>{detail?.content}</Text>
        </View>
      </ScrollView>
      
      {detail?.message_type === 1 && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.handleButton}
            onPress={() => {
              // 处理按钮点击事件
              navigation.goBack();           }}
          >
            <Text style={styles.handleButtonText}>去处理</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 15,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 10,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  message: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    paddingLeft: 50,  // 与图标对齐
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  handleButton: {
    backgroundColor: '#1892e5',
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 