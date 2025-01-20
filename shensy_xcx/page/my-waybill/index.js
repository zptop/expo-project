import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Linking, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import request from '../../util/request';
import toast from '../../util/toast';
import DatePicker from '../../components/DatePicker';
import Dialog from '../../components/Dialog';
import * as Location from 'expo-location';
export default function WaybillList({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [waybills, setWaybills] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messageNum, setMessageNum] = useState(0);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [remark, setRemark] = useState('');
  const [locationPermissionDialogVisible, setLocationPermissionDialogVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationDialogContent, setLocationDialogContent] = useState('需要获取您的位置信息才能继续操作，请允许获取位置权限。');
  const [is_agent_flag, setIs_agent_flag] = useState('');
  const [is_jiangsu_flag, setIs_jiangsu_flag] = useState('');
  // 获取未读消息数量
  const getUnreadMessageCount = async () => {
    try {
      const res = await request.get('/app_driver/message/getUnreadCount');
      if (res.code === 0 && res.data) {
        setMessageNum(res.data.message_num > 99 ? '99+' : res.data.message_num);
      } else {
        toast.show(res.msg || '获取未读消息数量失败');
      }
    } catch (error) {
      toast.show(error.message || '获取未读消息数量失败');
    }
  };

  //获取司机状态（代征协议、江苏税务实名）
  const getDriverStatus = async () => {
    const res = await request.get('/app_driver/user/getUserStatus');
    if (res.code === 0 && res.data) {
      setIs_agent_flag(res.data.is_agent_flag);
      setIs_jiangsu_flag(res.data.is_jiangsu_flag);
    } else {
      toast.show(res.msg || '获取司机状态失败');
    }
  };
  // 获取运单列表
  const getWaybillList = async (page = 1, isRefresh = false) => {
    try {
      // 转换状态值
      let category = 0;
      switch (activeTab) {
        case 0: // 全部
          category = 0;
          break;
        case 1: // 运输中
          category = 35;
          break;
        case 2: // 已完成
          category = 55;
          break;
      }

      const res = await request.get('/app_driver/waybill/getWaybillList', {
        page,
        pageSize: 10,
        waybill_category: category,
        keyword: searchText
      });

      if (res.code === 0 && res.data) {
        const newList = res.data.list || [];
        if (isRefresh) {
          setWaybills(newList);
        } else {
          setWaybills(prev => [...prev, ...newList]);
        }
        setHasMore(newList.length === 10);
        setPageIndex(page);
      } else {
        toast.show(res.msg || '获取运单列表失败');
      }
    } catch (error) {
      toast.show(error.message || '获取运单列表失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 处理按钮点击
  const handleActionButtonClick = async (item) => {
    // 1. 检查位置权限状态
    let { status } = await Location.getForegroundPermissionsAsync();

    // 2. 如果没有权限，显示权限请求弹框
    if (status !== 'granted') {
      setSelectedWaybill(item);
      setLocationDialogContent('需要获取您的位置信息才能继续操作，请允许获取位置权限。');
      setLocationPermissionDialogVisible(true);
      return;
    }

    // 检查 GPS 是否开启
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      setLocationDialogContent('请开启GPS定位后重试');
      setLocationPermissionDialogVisible(true);
      return;
    }

    // 获取位置信息，使用 -1 表示无限期显示
    toast.show('正在获取位置信息...', -1);
    let location;
    try {
      location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
      });
    } catch (error) {
      toast.close();  // 确保关闭之前的 toast
      setLocationDialogContent('获取位置信息失败，请检查GPS是否开启');
      setLocationPermissionDialogVisible(true);
      return;
    }

    if (!location || !location.coords || !location.coords.latitude || !location.coords.longitude) {
      toast.close();  // 确保关闭之前的 toast
      setLocationDialogContent('无法获取准确的位置信息，请稍后重试');
      setLocationPermissionDialogVisible(true);
      return;
    }

    // 获取位置成功后，先关闭之前的 toast，再显示成功提示
    toast.close();  // 关闭之前的 toast
    toast.show('获取位置成功');  // 显示成功提示

    setCurrentLocation(location);
    setSelectedWaybill(item);
    setDatePickerVisible(true);
  };

  // 4. 处理日期选择确认
  const handleDateConfirm = async (selectedDate) => {
    setDatePickerVisible(false);

    if (!selectedWaybill || !currentLocation) return;

    try {
      // 根据操作类型用不同的接口
      if (selectedWaybill.driver_transport_action === 30) {
        // 到达目的地
        const res = await request.post('/app_driver/waybill/driverArrive', {
          waybill_id: parseInt(selectedWaybill.waybill_id),
          goods_receipt_time: selectedDate.toISOString(),
          lng: currentLocation.coords.longitude,
          lat: currentLocation.coords.latitude,
        });

        if (res.code === 0) {
          toast.show('操作成功');
          handleRefresh();
        } else if (res.code === 76132) {
          // 先设置 selectedWaybill，确保包含所有必要信息
          const waybillInfo = {
            waybill_id: selectedWaybill.waybill_id,
            driver_transport_action: selectedWaybill.driver_transport_action,
            selectedDate: selectedDate,
            location: currentLocation
          };
          setSelectedWaybill(waybillInfo);
          setTimeout(() => {
            setDialogVisible(true);
          }, 100);
        } else {
          toast.show(res.msg || '操作失败');
        }
      } else {
        // 离开目的地
        const res = await request.post('/app_driver/waybill/driverLeave', {
          waybill_id: parseInt(selectedWaybill.waybill_id),
          leave_unload_time: selectedDate.toISOString(),
          lng: currentLocation.coords.longitude,
          lat: currentLocation.coords.latitude,
        });

        if (res.code === 0) {
          toast.show('操作成功');
          handleRefresh();
        } else {
          toast.show(res.msg || '操作失败');
        }
      }
    } catch (error) {
      console.error('请求出错:', error);
      toast.show(error.message || '操作失败');
    }
  };

  // 处理位置权限确认
  const handleLocationPermissionConfirm = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionDialogVisible(false);

      if (status === 'granted') {
        // 重新执行按钮点击事件
        if (selectedWaybill) {
          handleActionButtonClick(selectedWaybill);
        }
      } else {
        toast.show('需要定位权限才能继续操作，请在系统设置中开启定位权限');
      }
    } catch (error) {
      toast.show('请求位置权限失败');
    }
  };

  // 初始加载
  useEffect(() => {
    getUnreadMessageCount();
    getDriverStatus();
    getWaybillList(1, true);
  }, [activeTab]);

  // 搜索
  const handleSearch = () => {
    getWaybillList(1, true);
  };

  // 下拉刷新
  const handleRefresh = () => {
    setRefreshing(true);
    getWaybillList(1, true);
  };

  // 加载更多
  const handleLoadMore = () => {
    if (hasMore && !refreshing) {
      getWaybillList(pageIndex + 1);
    }
  };

  // 确认提交
  const handleConfirmSubmit = async () => {
    if (!remark.trim()) {
      toast.show('请输入说明');
      return;
    }

    try {
      const res = await request.post('/app_driver/waybill/driverArrive', {
        waybill_id: selectedWaybill.waybill_id,
        driver_transport_action: selectedWaybill.driver_transport_action,
        confirm_flag: 1,
        confirm_remark: remark,
        lng: currentLocation.coords.longitude,
        lat: currentLocation.coords.latitude,
      });

      if (res.code === 0) {
        toast.show('操作成功');
        setDialogVisible(false);
        setRemark('');
        handleRefresh();
      } else {
        toast.show(res.msg || '操作失败');
      }
    } catch (error) {
      toast.show(error.message || '操作失败');
    }
  };  // 修改点击事件处理函数
  const handleAuthClick = () => {
    navigation.navigate('TaxAuth');
  };

  // 添加代征协议签署跳转函数
  const handleAgentSign = () => {
    navigation.navigate('AgentSign');
  };

  // 跳转到协议单详情
  const goToWaybillDetail = (waybill_id) => {
    navigation.navigate('AgreementDetails', { 
        waybill_id,
        title: '协议单详情'
    });
  };

  // 渲染运单项
  const renderWaybillItem = ({ item }) => (
    <TouchableOpacity
      style={styles.waybillItem}
    onPress={() => navigation.navigate('WaybillDetail', { waybill_id: item.waybill_id,action_driver_evaluate:item.action_driver_evaluate })}
    >
      <View style={styles.locationRow}>
        <View style={styles.addressContainer}>
          <View style={styles.addressRow}>
            <Image
              source={require('../../assets/shensy_driver_xcx_images/start-add.png')}
              style={styles.addressIcon}
            />
            <Text style={styles.address} numberOfLines={1}>{item.from_code_text}</Text>
          </View>
          <View>
            <Text style={styles.customInfo}>客户单号：{item.customer_order_no}</Text>
          </View>
          <View>
            <Text style={styles.customInfo}>客户名称：{item.customer_name}</Text>
          </View>
          <View style={styles.addressRow}>
            <Image
              source={require('../../assets/shensy_driver_xcx_images/end-add.png')}
              style={styles.addressIcon}
            />
            <Text style={styles.address} numberOfLines={1}>{item.to_code_text}</Text>
          </View>
        </View>
        <Text style={[
          styles.status,
          item.waybill_status === 35 && styles.statusOngoing,  // 运输中
          item.waybill_status === 55 && styles.statusCompleted  // 已完成
        ]}>
          {item.waybill_status_text}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
        <Text style={styles.label}>货物名称</Text>
          <Text style={styles.value}>{item.goods_name}</Text>
        </View>
        <View style={styles.infoItem}>
        <Text style={styles.label}>车长类型</Text>
          <Text style={styles.value}>{item.vehicle_length_type_text}</Text>
      </View>
        <View style={styles.infoItem}>
        <Text style={styles.label}>运单号</Text>
          <Text style={styles.value}>{item.waybill_no}</Text>
        </View>
      </View>

      <View style={styles.companyRow}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.shipper_name ? item.shipper_name.charAt(0) : ''}
            </Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.company} numberOfLines={1}>{item.company_name}</Text>
            <Text style={styles.contact}>货主：{item.shipper_name}</Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={async () => {
              try {
                // 获取合同URL
                const res = await request.get('/app_driver/waybill/getContractUrl', {
                  waybill_no: item.waybill_no
                },true);

                if (res.code === 0 && res.data) {
                  // 修改跳转目标为 SignContract
                  if (item.contract_type === 1) {
                    navigation.navigate('SignContract', {
                      contractUrl: res.data.url
                    });
                  } else {
                    navigation.navigate('SignContractImg', { contractUrl: res.data.url });
                  }
                } else {
                  toast.show(res.msg || '获取合同URL失败');
                }
              } catch (error) {
                toast.show(error.message || '获取合同URL失败');
              }
            }}
            style={styles.iconButton}
          >
            {item.contract_sign_status_text && (
              <View style={styles.tips}>
                <Text style={styles.tipsText} numberOfLines={1}>
                  {item.contract_sign_status_text}
                </Text>
              </View>
            )}
            <FontAwesome
              name="file-text"
              size={16}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${item.shipper_mobile}`)}
            style={{
              width: 35,
              height: 35,
              borderRadius: 17.5,
              backgroundColor: '#1892e5',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <FontAwesome
              name="phone"
              size={16}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          {(() => {
            const buttons = [];
            if (item.driver_transport_action === 10 || item.driver_transport_action === 20) {
              buttons.push(
                <TouchableOpacity
                  key="depart"
                  style={[styles.actionButton, { width: '100%' }]}
                  onPress={() => navigation.navigate('AgreementDetails', { 
                      waybill_id: item.waybill_id,
                      from_flag: 'start',
                      title: '确认发车'
                  })}
                >
                  <Text style={styles.actionButtonText}>
                    <FontAwesome name="car" size={16} color="#fff" /> 确认发车
                  </Text>
                </TouchableOpacity>
              );
            }

            if (item.driver_transport_action === 30 || item.driver_transport_action === 40) {
              buttons.push(
                <TouchableOpacity
                  key={item.driver_transport_action === 30 ? 'arrive' : 'leave'}
                  style={[styles.actionButton, { width: '100%' }]}
                  onPress={() => handleActionButtonClick(item)}
                >
                  <Text style={styles.actionButtonText}>
                    <FontAwesome name="map-marker" size={16} color="#fff" /> {item.driver_transport_action === 30 ? '到达目的地' : '离开目的地'}
                  </Text>
                </TouchableOpacity>
              );
            }

            if (item.action_driver_evaluate > 0) {
              buttons.push(
                <TouchableOpacity
                  key="evaluate"
                  style={[styles.actionButton, { width: '100%' }]}
                  onPress={() => navigation.navigate('EvaluateOwner', { waybill_id: item.waybill_id })}
                >
                  <Text style={styles.actionButtonText}>
                    <FontAwesome name="star" size={16} color="#fff" /> 评价货主
                  </Text>
                </TouchableOpacity>
              );
            }

            if (item.action_driver_preview === 1) {
              buttons.push(
                <TouchableOpacity
                  key="preview"
                  style={[styles.actionButton, { width: '100%' }]}
                  onPress={() => goToWaybillDetail(item.waybill_id)}
                >
                  <Text style={styles.actionButtonText}>
                    <FontAwesome name="file-text-o" size={16} color="#fff" /> 协议单详情
                  </Text>
                </TouchableOpacity>
              );
            }

            if (item.driver_transport_action === 50) {
              buttons.push(
                <TouchableOpacity
                  key="upload"
                  style={[styles.actionButton, { width: '100%' }]}
                  onPress={() => navigation.navigate('ReportEvent', { 
                      waybill_id: item.waybill_id,
                      flag: 'receipt'
                  })}
                >
                  <Text style={styles.actionButtonText}>
                    <FontAwesome name="upload" size={16} color="#fff" /> 上传回单
                  </Text>
                </TouchableOpacity>
              );
            }

            // 如果有多个按钮，则平分一行显示
            if (buttons.length >= 2) {
              return buttons.map((button, index) => (
                <View key={index} style={{ flex: 1 }}>
                  {React.cloneElement(button, {
                    style: [
                      styles.actionButton,
                      { flex: 1 },
                      index < buttons.length - 1 && { marginRight: 10 }
                    ]
                  })}
                </View>
              ));
            }

            // 单个按钮时单独一行
            return buttons;
          })()}
      </View>
    </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.container}>
        {/* 顶部提示区域 */}
        <View style={styles.noticeContainer}>
          {/* 税务认证提示 */}
          {is_jiangsu_flag !== 0 && (
            <TouchableOpacity 
              style={[styles.noticeItem, styles.authNotice]} 
              onPress={handleAuthClick}
            >
              <Text style={styles.authNoticeText}>
                请完成税务实名认证
              </Text>
              <Text style={styles.authNoticeButton}>立即验证</Text>
            </TouchableOpacity>
          )}
          
          {/* 代征协议签署提示 */}
          {is_agent_flag == 0 && (
            <TouchableOpacity
              style={styles.noticeItem}
              onPress={handleAgentSign}
            >
              <Text style={styles.noticeText}>您还未签署代征协议</Text>
              <Text style={styles.noticeButton}>立即签署</Text>
            </TouchableOpacity>
          )}
        </View>

      {/* 搜索栏 */}
      <View style={styles.searchBar}>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => navigation.navigate('Message')}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#333" />
            {messageNum > 0 && (
              <View style={styles.messageBadge}>
                <Text style={styles.badgeText}>{messageNum}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
              placeholder="搜索货主手号、运单号"
          value={searchText}
          onChangeText={setSearchText}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>搜索</Text>
          </TouchableOpacity>
      </View>

      {/* 标签栏 */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 0 && styles.activeTab]}
            onPress={() => setActiveTab(0)}
        >
            <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>全部</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 1 && styles.activeTab]}
            onPress={() => setActiveTab(1)}
        >
            <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>运输中</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 2 && styles.activeTab]}
            onPress={() => setActiveTab(2)}
        >
            <Text style={[styles.tabText, activeTab === 2 && styles.activeTabText]}>已完成</Text>
        </TouchableOpacity>
      </View>

      {/* 运单列表 */}
      <FlatList
        data={waybills}
        renderItem={renderWaybillItem}
          keyExtractor={item => item.waybill_id.toString()}
        style={styles.list}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Image
                source={require('../../assets/shensy_driver_xcx_images/no-data-icon-2.png')}
                style={styles.emptyImage}
              />
              <Text style={styles.emptyText}>暂无运单数据</Text>
            </View>
          )}
        />
      </View>

      {/* 日期选择器 */}
      <DatePicker
        isVisible={datePickerVisible}
        date={new Date()}
        onConfirm={handleDateConfirm}
        onCancel={() => setDatePickerVisible(false)}
        action={selectedWaybill?.driver_transport_action}
        title={selectedWaybill?.driver_transport_action === 30 ? '确认到达目的地时间' : '确认离开目的地时间'}
      />

      {/* 位置权限请求弹框 */}
      <Dialog
        visible={locationPermissionDialogVisible}
        title="需要获取位置权限"
        onCancel={() => {
          setLocationPermissionDialogVisible(false);
          setSelectedWaybill(null);
          setLocationDialogContent('需要获取您的位置信息才能继续操作，请允许获取位置权限。');
        }}
        onConfirm={handleLocationPermissionConfirm}
      >
        <Text style={styles.dialogContent}>
          {locationDialogContent}
        </Text>
      </Dialog>

      {/* 距离超限弹框 */}
      <Dialog
        visible={dialogVisible}
        title="GPS定位与目的地超过50公里"
        onCancel={() => {
          setDialogVisible(false);
          setRemark('');
        }}
        onConfirm={handleConfirmSubmit}
      >
        <TextInput
          style={styles.remarkInput}
          placeholder="请说明情况"
          value={remark}
          onChangeText={setRemark}
          multiline
          numberOfLines={3}
        />
      </Dialog>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F6F7',
  },
  noticeContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noticeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 4,
    paddingHorizontal: 12,
    backgroundColor: '#fffaf2',
  },
  authNotice: {
    backgroundColor: '#ECF4FB',
    borderRadius: 4,
  },
  authNoticeText: {
    fontSize: 14,
    color: '#1892e5',
  },
  authNoticeButton: {
    fontSize: 14,
    color: '#1892e5',
    borderWidth: 1,
    borderColor: '#1892e5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#FF8C11',
  },
  noticeButton: {
    fontSize: 14,
    color: '#FF8C11',
    borderWidth: 1,
    borderColor: '#FF8C11',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
  },
  messageButton: {
    marginRight: 12,
    position: 'relative',
  },
  messageBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF0000',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F7',
    borderRadius: 4,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 14,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#1892E5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#003B90',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#003B90',
    fontWeight: 'bold',
    height: 24,
  },
  list: {
    flex: 1,
    padding: 12,
  },
  waybillItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addressContainer: {
    flex: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressIcon: {
    width: 20,
    height: 24,
    marginRight: 8,
  },
  address: {
    flex: 1,
    fontSize: 18,
    color: '#333',
  },
  customInfo: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    fontSize: 14,
    color: '#989898',
    paddingHorizontal: 28,
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  },
  status: {
    fontSize: 14,
    color: '#003B90',
    marginLeft: 12,
  },
  statusOngoing: {
    color: '#00A870',
  },
  statusCompleted: {
    color: '#999',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f7f7f7',
    borderBottomWidth: 1,
    borderBottomColor: '#f7f7f7',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#989898',
    marginBottom: 8,
  },
  value: {
    fontSize: 13,
    color: '#222',
  },
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
  },
  avatarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    color: '#1892E5',
    fontWeight: '500',
  },
  companyInfo: {
    flex: 1,
  },
  company: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  contact: {
    fontSize: 13,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#1892e5',
    height: 36,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  iconButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#1892e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  tips: {
    position: 'absolute',
    top: -15,
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: '#ff0000',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 80,
    width: 'auto',
    maxWidth: 'none',
    whiteSpace: 'nowrap',
  },
  tipsText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
  remarkInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
  },
  dialogContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 10,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  previewModal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  previewCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 