import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import request from '../../util/request';
import toast from '../../util/toast';

export default function Message({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 获取消息列表
  const getMessageList = async (page = 1, isRefresh = false) => {
    try {
      const res = await request.get('/app_driver/message/getList', {
        page,
        pageSize: 10
      });

      if (res.code === 0 && res.data) {
        const newList = res.data.list || [];
        if (isRefresh) {
          setMessages(newList);
        } else {
          setMessages(prev => [...prev, ...newList]);
        }
        setHasMore(newList.length === 10);
        setPageIndex(page);
      } else {
        toast.show(res.msg || '获取消息列表失败');
      }
    } catch (error) {
      toast.show(error.message || '获取消息列表失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 初始加载
  useEffect(() => {
    getMessageList(1, true);
  }, []);

  // 下拉刷新
  const handleRefresh = () => {
    setRefreshing(true);
    getMessageList(1, true);
  };

  // 加载更多
  const handleLoadMore = () => {
    if (hasMore && !refreshing) {
      getMessageList(pageIndex + 1);
    }
  };

  // 渲染消息项
  const renderMessageItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.messageItem}
      onPress={() => navigation.navigate('MessageDetail', { id: item.id })}
    >
      <View style={styles.iconContainer}>
        <View style={{ position: 'relative' }}>
          <MaterialCommunityIcons name="message" size={24} color="#333" />
          {item.is_read === 0 && <View style={styles.redDot} />}
        </View>
      </View>
      <View style={styles.messageContent}>
        <Text style={styles.messageTitle}>{item.subject}</Text>
        <Text style={styles.messageTime}>{item.create_time_desc}</Text>
      </View>
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无消息</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F7',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  messageContent: {
    flex: 1,
    marginLeft: 10,
  },
  messageTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  arrowContainer: {
    paddingLeft: 10,
  },
  arrow: {
    fontSize: 20,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff0000',
    position: 'absolute',
    top: -2,
    right: -2,
  },
}); 