import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import request from '../../util/request';
import ImagePreview from '../../components/ImagePreview';
import toast from '../../util/toast';
import config from '../../util/config';

export default function MyProfileDetail({ route, navigation }) {
    const [userInfo, setUserInfo] = useState({});
    const [images, setImages] = useState([]);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);

    // 获取用户信息
    const getUserIdentify = async () => {
        try {
            const res = await request.get('/app_driver/user/getUserIdentify');
            if (res.code === 0) {
                setUserInfo(res.data);
                // 处理证件照片
                const imgArr = [
                    { src: res.data.id_pic1_desc, title: '身份证头像照' },
                    { src: res.data.id_pic2_desc, title: '身份证国徽照' },
                    { src: res.data.driver_lic_pic_desc, title: '驾驶证正页' },
                    { src: res.data.driver_lic_side_pic_desc, title: '驾驶证副页' },
                    ...(res.data.qual_cert_pics || []).map((item, index) => ({
                        src: item.qual_cert_pic_desc,
                        title: `从业资格证${index + 1}`
                    }))
                ];
                setImages(imgArr);
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
        }
    };

    // 查看大图
    const handlePreview = (index) => {
        setPreviewIndex(index);
        setPreviewVisible(true);
    };


    // 处理图片上传结果
    const handleImageResult = async (tempFilePath) => {
        try {
            // 获取文件扩展名
            const fileExtension = tempFilePath.substring(tempFilePath.lastIndexOf('.') + 1).toLowerCase();

            // 获取 OSS 配置
            const ossConfig = await config.getOssMess(fileExtension);
            if (!ossConfig.isSucc) {
                throw new Error('获取OSS配置失败');
            }

            // 上传文件到 OSS
            return new Promise((resolve, reject) => {
                config.ossUpLoadFileRequest(
                    'image',
                    '上传中...',
                    tempFilePath,
                    {},
                    'upload',
                    (data) => {
                        if (data.statusCode === 204) {
                            if (ossConfig.ossParam?.DirKey) {
                                resolve(ossConfig.ossParam.DirKey);
                            } else {
                                reject(new Error('上传失败：无效的 DirKey'));
                            }
                        } else {
                            reject(new Error(data.msg || '上传失败'));
                        }
                    },
                    (error) => {
                        reject(new Error(error.msg || '上传失败'));
                    }
                );
            }).then(async (dirKey) => {
                // 获取上传后的 URL
                const urlRes = await request.get('/app_driver/obs/getObsUrl', {
                    obs_key: dirKey
                });

                if (urlRes.code === 0) {
                    // 更新头像
                    const updateRes = await request.post('/app_driver/user/exchangeUserInfo', {
                        chg_type: 1,
                        icon_small: urlRes.data.url_key
                    });

                    if (updateRes.code === 0) {
                        toast.show('头像更新成功');
                        getUserIdentify(); // 刷新用户信息
                    } else {
                        toast.show(updateRes.msg || '头像更新失败');
                    }
                }
            });
        } catch (error) {
            console.error('处理图片失败:', error);
            toast.show(error.message || '上传失败');
            throw error;
        }
    };

    // 修改头像上传处理函数
    const handleAvatarUpload = async () => {
        try {
            // 显示选择方式弹窗
            Alert.alert(
                '选择上传方式',
                '',
                [
                    {
                        text: '拍照',
                        onPress: () => handleImageUpload('camera')
                    },
                    {
                        text: '从相册选择',
                        onPress: () => handleImageUpload('album')
                    },
                    {
                        text: '取消',
                        style: 'cancel'
                    }
                ]
            );
        } catch (error) {
            console.error('选择上传方式失败:', error);
            toast.show('选择失败');
        }
    };

    // 添加图片上传处理函数
    const handleImageUpload = async (type) => {
        try {
            // 请求相应权限
            let { status } = type === 'camera' 
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                toast.show(`需要访问${type === 'camera' ? '相机' : '相册'}权限才能继续`);
                return;
            }

            // 选择图片方法
            const method = type === 'camera' 
                ? ImagePicker.launchCameraAsync 
                : ImagePicker.launchImageLibraryAsync;

            // 打开图片选择器或相机
            const result = await method({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            // 检查是否选择了图片
            if (!result.canceled && result.assets[0]) {
                // 处理选择结果
                await handleImageResult(result.assets[0].uri);
            }
        } catch (error) {
            console.error('选择图片失败:', error);
            toast.show('选择图片失败');
        }
    };

    useEffect(() => {
        getUserIdentify();
    }, []);

    return (
        <ScrollView style={styles.container}>
            {/* 用户基本信息 */}
            <View style={styles.userInfo}>
                <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={handleAvatarUpload}
                >
                    <Text style={styles.avatarText}>我的头像</Text>
                    <View style={styles.avatarRight}>
                        <Image
                            source={{ uri: userInfo.icon_small_desc }}
                            style={styles.avatar}
                        />
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={20}
                            color="#999"
                            style={styles.avatarArrow}
                        />
                    </View>
                </TouchableOpacity>
                <View style={styles.infoList}>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>姓名</Text>
                        <Text style={styles.value}>{userInfo.real_name}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>手机号</Text>
                        <Text style={styles.value}>{userInfo.mobile}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>身份证号</Text>
                        <Text style={styles.value}>{userInfo.id_card_no}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>银行卡号</Text>
                        <Text style={styles.value}>{userInfo.bank_card_no}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>开户行</Text>
                        <Text style={styles.value}>{userInfo.bank_name}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>推荐人</Text>
                        <Text style={styles.value}>{userInfo.referral_code || '无'}</Text>
                    </View>
                </View>
            </View>

            {/* 证件照片展示 */}
            <View style={styles.imageContainer}>
                <Text style={styles.sectionTitle}>证件照片</Text>
                <View style={styles.imageGrid}>
                    {images.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.imageItem,
                                (index + 1) % 3 === 0 && styles.imageItemLast
                            ]}
                            onPress={() => handlePreview(index)}
                        >
                            <Image
                                source={{ uri: item.src }}
                                style={styles.image}
                            />
                            <Text style={styles.imageTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* 图片预览 */}
            <ImagePreview
                visible={previewVisible}
                images={images.map(item => item.src)}
                initialIndex={previewIndex}
                onClose={() => setPreviewVisible(false)}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    userInfo: {
    },
    avatarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    avatarText: {
        fontSize: 14,
        color: '#333',
    },
    avatarRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    avatarArrow: {
        marginLeft: 5,
    },
    infoList: {
        backgroundColor: '#fff',
        marginTop: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    label: {
        width: 80,
        fontSize: 14,
        color: '#333',
    },
    value: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        textAlign: 'right',
        marginRight: 10,
    },
    imageContainer: {
        backgroundColor: '#fff',
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 14,
        color: '#333',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 5,
    },
    imageItem: {
        width: '31%',
        marginBottom: 15,
        marginRight: '3.5%',
    },
    imageItemLast: {
        marginRight: 0,
    },
    image: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 4,
    },
    imageTitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
}); 