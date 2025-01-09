import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, SafeAreaView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import request from '../../util/request';
import toast from '../../util/toast';

export default function VehicleManagement({ navigation }) {
    const [listData, setListData] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddBtn, setShowAddBtn] = useState(0);
    const [selectedVehicle, setSelectedVehicle] = useState('1');

    // 获取车辆列表
    const getList = async (pageNum = 1) => {
        if (isLoading) return;
        try {
            setIsLoading(true);
            const res = await request.get('/app_driver/vehicle/getVehicleList', {
                page: pageNum,
                pageSize: 10
            });

            if (res.code === 0) {
                if (res.data.list?.length) {
                    const formattedList = res.data.list.map(item => ({
                        ...item,
                        is_default: item.is_default.toString()
                    }));

                    setListData(pageNum === 1 ? formattedList : [...listData, ...formattedList]);
                    setShowAddBtn(res.data.show_add_btn);
                } else if (pageNum > 1) {
                    toast.show('没有更多');
                }
            } else {
                toast.show(res.msg);
            }
        } catch (error) {
            console.error('获取车辆列表失败:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 设置默认车辆
    const handleSetDefault = async (user_vehicleid, index) => {
        try {
            const res = await request.post('/app_driver/vehicle/setVehicleDefault', {
                user_vehicleid
            });

            if (res.code === 0) {
                toast.show('设置成功');
                getList(1);
                // setSelectedVehicle(index.toString());
            } else {
                toast.show(res.msg);
            }
        } catch (error) {
            console.error('设置默认车辆失败:', error);
        }
    };

    // 删除车辆
    const handleDelete = (user_vehicleid) => {
        Alert.alert(
            '提示',
            '确定删除车辆信息?',
            [
                {
                    text: '取消',
                    style: 'cancel'
                },
                {
                    text: '确定',
                    onPress: async () => {
                        try {
                            const res = await request.post('/app_driver/vehicle/delUserVehicle', {
                                user_vehicleid
                            });

                            if (res.code === 0) {
                                toast.show('删除成功');
                                getList(1);
                            } else {
                                toast.show(res.msg);
                            }
                        } catch (error) {
                            console.error('删除车辆失败:', error);
                        }
                    }
                }
            ]
        );
    };

    // 编辑车辆
    const handleEdit = (user_vehicleid, vehicle_number) => {
        navigation.navigate('VehicleAdd', {
            user_vehicleid: user_vehicleid.toString(), // 转换为字符串
            vehicle_number
        });
    };

    // 新增车辆
    const handleAdd = () => {
        navigation.navigate('VehicleAdd', {
            user_vehicleid: '', // 使用空字符串
            vehicle_number: ''
        });
    };

    // 渲染车辆项
    const renderItem = ({ item, index }) => (
        <View style={styles.vehicleItem}>
            <TouchableOpacity
                style={styles.vehicleContent}
                onPress={() => navigation.navigate('VehicleDetail', { user_vehicleid: item.user_vehicleid })}
            >
                <View style={styles.vehicleLeft}>
                    <View style={styles.vehicleBasic}>
                        <View style={styles.vehicleNum}>
                            <Text style={styles.vehicleNumText}>{item.vehicle_number}</Text>
                        </View>
                        <Text style={styles.settlerText}>结算人：{item.settler_name}</Text>
                    </View>
                    <Text style={styles.vehicleInfo}>
                        {`${item.vehicle_length_type}/${item.vehicle_tonnage} ${item.vehicle_type}`}
                    </Text>
                    <TouchableOpacity
                        style={styles.radioButton}
                        onPress={() => handleSetDefault(item.user_vehicleid, index)}
                    >
                        <View style={[
                            styles.radio,
                            selectedVehicle === item.is_default && styles.radioSelected
                        ]} />
                        <Text style={styles.radioText}>设为默认车辆</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.vehicleRight}>
                    <TouchableOpacity
                        style={[styles.iconButton, styles.editButton]}
                        onPress={() => handleEdit(item.user_vehicleid, item.vehicle_number)}
                    >
                        <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconButton, styles.deleteButton]}
                        onPress={() => handleDelete(item.user_vehicleid)}
                    >
                        <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </View>
    );

    useEffect(() => {
        getList(1);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                style={styles.list}
                data={listData}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                onRefresh={() => {
                    setPage(1);
                    getList(1);
                }}
                refreshing={isLoading}
                onEndReached={() => {
                    if (!isLoading) {
                        setPage(prev => prev + 1);
                        getList(page + 1);
                    }
                }}
                onEndReachedThreshold={0.1}
            />

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAdd}
                >
                    <Text style={styles.addButtonText}>新增车辆</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    list: {
        flex: 1,
    },
    buttonContainer: {
        backgroundColor: '#fff',
        paddingBottom: Platform.OS === 'ios' ? 0 : 15, // iOS 使用 SafeAreaView，Android 添加底部间距
    },
    addButton: {
        height: 50,
        backgroundColor: '#1892e5',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 15,
        borderRadius: 4,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    vehicleItem: {
        backgroundColor: '#fff',
        marginBottom: 1,
    },
    vehicleContent: {
        flexDirection: 'row',
        padding: 15,
    },
    vehicleLeft: {
        flex: 1,
    },
    vehicleBasic: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    vehicleNum: {
        borderWidth: 1,
        borderColor: '#1892e5',
        marginRight: 10,
        padding: 1,
    },
    vehicleNumText: {
        backgroundColor: '#1892e5',
        color: '#fff',
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: 13,
    },
    settlerText: {
        color: '#666',
        fontSize: 14,
    },
    vehicleInfo: {
        color: '#a0a0a0',
        fontSize: 13,
        marginBottom: 10,
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 6,
    },
    radioSelected: {
        borderColor: '#1892e5',
        backgroundColor: '#1892e5',
    },
    radioText: {
        fontSize: 14,
        color: '#333',
    },
    vehicleRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    editButton: {
        backgroundColor: '#1989fa',
    },
    deleteButton: {
        backgroundColor: '#ef3125',
    },
}); 