import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Image,
  Platform,
  TouchableOpacity
} from 'react-native';
import request from '../../../util/request';
import toast from '../../../util/toast';

export default function RemoteUnload({ route, navigation }) {
  const { waybill_id, waybill_no } = route.params;
  const [listData, setListData] = useState([]);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const pageSize = 10;
  const [isAjax, setIsAjax] = useState(false);

  // 获取列表数据
  const getList = async () => {
    try {
      const res = await request.get('/app_driver/unload_place/getList', {
        page,
        pageSize,
        waybill_id,
        waybill_no
      }, true);

      if (res.code === 0) {
        if (res.data.list && res.data.list.length) {
          let total = 0;
          res.data.list.forEach(item => {
            total += Number(item.waybill_amount);
          });
          
          setListData(prev => [...prev, ...res.data.list]);
          setTotalAmount(total.toFixed(2));
          setIsAjax(false);
        } else {
          if (page > 1) {
            toast.show('没有更多数据');
          } else {
            setIsAjax(true);
          }
        }
      } else {
        toast.show(res.msg);
      }
    } catch (error) {
      toast.show('获取数据失败');
    }
  };

  // 返回上一页并传递数据
  const goBack = () => {
    const nonlocalUnloadAmountData = {
      nonlocal_unload_amount: totalAmount
    };
    navigation.navigate('AgreementDetails', nonlocalUnloadAmountData);
  };

  // 下拉刷新
  const onPullDownRefresh = () => {
    setListData([]);
    setPage(1);
    setIsAjax(false);
    getList();
  };

  // 上拉加载更多
  const onReachBottom = () => {
    setPage(prev => prev + 1);
    getList();
  };

  useEffect(() => {
    getList();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullDownRefresh}
          />
        }
        onScroll={({nativeEvent}) => {
          const {layoutMeasurement, contentOffset, contentSize} = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
            onReachBottom();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* 详细地址 */}
        <View style={styles.section}>
          <View style={styles.leftContent}>
            <Image 
              source={require('../../../assets/shensy_driver_xcx_images/start-08.png')}
              style={styles.icon}
            />
            <View style={styles.labelContainer}>
              <Text style={styles.requiredStar}>*</Text>
              <Text style={styles.label}>详细地址</Text>
            </View>
          </View>
          <Text style={styles.value}>浙江省杭州市萧山区</Text>
        </View>

        {/* 单价 */}
        <View style={styles.section}>
          <View style={styles.leftContent}>
            <Image 
              source={require('../../../assets/shensy_driver_xcx_images/start-17.png')}
              style={styles.icon}
            />
            <View style={styles.labelContainer}>
              <Text style={styles.requiredStar}>*</Text>
              <Text style={styles.label}>单价(元)</Text>
            </View>
          </View>
          <Text style={styles.value}>11</Text>
        </View>

        {/* 费用明细 */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>重量</Text>
              <Text style={styles.detailValue}>1.1</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>体积</Text>
              <Text style={styles.detailValue}>1.1</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>行程总费</Text>
              <Text style={styles.detailValue}>111</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部固定按钮 - 使用与 vehicle-add 相同的布局 */}
      <SafeAreaView style={styles.bottomSafeArea}>
        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={goBack}
          >
            <Text style={styles.submitBtnText}>
              异地卸货总费用: ¥ {totalAmount}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee'
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 8
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  requiredStar: {
    color: '#ff4d4f',
    marginRight: 4,
    fontSize: 14
  },
  label: {
    fontSize: 14,
    color: '#666'
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right'
  },
  detailsContainer: {
    padding: 15
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  detailItem: {
    flex: 1,
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  detailValue: {
    fontSize: 14,
    color: '#333'
  },
  bottomSafeArea: {
    backgroundColor: '#fff'
  },
  bottomBtnContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    backgroundColor: '#fff'
  },
  submitBtn: {
    backgroundColor: '#1890ff',
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff'
  }
}); 