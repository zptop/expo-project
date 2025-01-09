import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Alert,
    Platform,
    Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import request from '../../../util/request';
import toast from '../../../util/toast';
import config from '../../../util/config';
import ImagePreview from '../../../components/ImagePreview';

// 直接引入图片，不需要包装成对象
const authExampleImage = require('../../../assets/shensy_driver_xcx_images/auth-6.png');

export default function TaxAuth({ navigation }) {
    const [verifyPic, setVerifyPic] = useState('');
    const [verifyPicShow, setVerifyPicShow] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [previewImages, setPreviewImages] = useState([]); // 添加预览图片数组状态

    // 修改查看示例图片方法
    const checkBigImgExample = () => {
        // 直接传递图片资源
        setPreviewImages([authExampleImage]);
        setShowPreview(true);
    };

    // 关闭预览
    const closePreview = () => {
        setShowPreview(false);
    };

    // 跳转到江苏税务小程序
    const goToCertification = async () => {
        try {
            // 直接尝试打开微信
            await Linking.openURL('weixin://');
            Alert.alert(
                '提示',
                '请在微信中搜索"江苏税务实名认证"小程序进行认证。',
                [
                    {
                        text: '我知道了',
                        style: 'default',
                    }
                ]
            );
        } catch (error) {
            Alert.alert(
                '提示',
                '请确保已安装微信，并手动打开微信搜索"江苏税务实名认证"小程序进行认证。',
                [
                    {
                        text: '我知道了',
                        style: 'default',
                    }
                ]
            );
        }
    };

    // 上传图片
    const upLoadImage = async () => {
        try {
            const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();

            if (libraryStatus !== 'granted' || cameraStatus !== 'granted') {
                toast.show('需要相册和相机权限才能上传图片');
                return;
            }

            Alert.alert(
                '选择图片来源',
                '请选择图片来源',
                [
                    {
                        text: '相机',
                        onPress: () => takePicture(),
                    },
                    {
                        text: '相册',
                        onPress: () => pickImage(),
                    },
                    {
                        text: '取消',
                        style: 'cancel',
                    },
                ],
            );
        } catch (error) {
            toast.show('上传失败');
        }
    };

    // 拍照
    const takePicture = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 1,
                aspect: [4, 3],
            });
            handleImageResult(result);
        } catch (error) {
            toast.show('拍照失败');
        }
    };

    // 从相册选择
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                quality: 1,
                aspect: [4, 3],
            });
            handleImageResult(result);
        } catch (error) {
            toast.show('选择图片失败');
        }
    };

    // 处理图片选择结果
    const handleImageResult = async (result) => {
        if (!result.canceled) {
            const { uri } = result.assets[0];
            const fileExtension = uri.split('.').pop().toLowerCase();

            if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                toast.show('不支持的文件格式');
                return;
            }

            let obj = await config.getOssMess(fileExtension);
            if (obj.isSucc) {
                config.ossUpLoadFileRequest('taxNameAuth', '上传税务实名认证图片', uri, {}, 1, (success) => {
                    if (success.statusCode == 204) {
                        toast.show('上传成功');
                        if (Object.keys(obj.ossParam).length && obj.ossParam.DirKey) {
                            getObsUrlHandle(obj.ossParam.DirKey);
                        }
                    } else {
                        toast.show(success.msg || '上传失败');
                    }
                }, (fail) => {
                    toast.show(fail.msg || '上传失败');
                });
            }
        }
    };

    // 获取图片 URL
    const getObsUrlHandle = async (obsKey) => {
        try {
            const res = await request.get('/app_driver/obs/getObsUrl', {
                obs_key: obsKey
            });

            if (res.code === 0) {
                setVerifyPic(res.data.url_key);
                setVerifyPicShow(res.data.url_text);
            } else {
                toast.show(res.msg);
            }
        } catch (error) {
            toast.show('获取图片地址失败');
        }
    };

    // 提交认证
    const submitHandle = async () => {
        if (!verifyPic) {
            toast.show('请上传结果图片');
            return;
        }

        try {
            const res = await request.post('/app_driver/user/upJiangsuTaxVerify', {
                jiangsu_verify_pic: verifyPic
            });

            if (res.code === 0) {
                toast.show('上传成功');
                navigation.goBack();
            } else {
                toast.show(res.msg);
            }
        } catch (error) {
            toast.show('提交失败');
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content}>
                <View style={styles.step}>
                    <Text style={styles.stepTitle}>第一步</Text>
                    <Text style={styles.stepContent}>
                        请使用微信扫描下方二维码或点击按钮，进入"江苏税务实名认证"小程序完成认证。
                    </Text>
                    <TouchableOpacity
                        style={styles.certButton}
                        onPress={goToCertification}
                    >
                        <Text style={styles.certButtonText}>前往认证</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.step}>
                    <Text style={styles.stepTitle}>第二步</Text>
                    <Text style={styles.stepContent}>
                        认证通过后，请按照下方示例截图上传认证结果。
                    </Text>
                    <TouchableOpacity onPress={checkBigImgExample}>
                        <Image 
                            source={authExampleImage}  // 直接使用图片资源
                            style={styles.exampleImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.viewExample}>查看大图</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.step}>
                    <Text style={styles.stepTitle}>第三步</Text>
                    <Text style={styles.stepContent}>
                        点击下方【上传结果】按钮，上传认证结果截图。
                    </Text>
                    {verifyPicShow ? (
                        <View style={styles.uploadedContainer}>
                            <Image
                                source={{ uri: verifyPicShow }}
                                style={styles.uploadPreviewImage}
                                resizeMode="cover"
                            />
                            <View style={styles.buttonGroup}>
                                <TouchableOpacity
                                    style={[styles.button, styles.reuploadButton]}
                                    onPress={upLoadImage}
                                >
                                    <Text style={styles.reuploadButtonText}>重新上传</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.submitButton]}
                                    onPress={submitHandle}
                                >
                                    <Text style={styles.submitButtonText}>确认提交</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={upLoadImage}
                        >
                            <Text style={styles.uploadButtonText}>上传结果</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* 图片预览组件 */}
            <ImagePreview
                visible={showPreview}
                images={previewImages}
                onClose={closePreview}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 15,
    },
    step: {
        marginBottom: 20,
    },
    stepTitle: {
        fontSize: 15,
        color: '#333',
        marginBottom: 10,
    },
    stepContent: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 10,
    },
    certButton: {
        backgroundColor: '#1892e5',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 10,
    },
    certButtonText: {
        color: '#fff',
        fontSize: 15,
    },
    viewExample: {
        color: '#1892e5',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    uploadButton: {
        backgroundColor: '#1892e5',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 10,
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 15,
    },
    uploadedContainer: {
        marginTop: 15,
    },
    uploadPreviewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 15,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        height: 44,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reuploadButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#1892e5',
        marginRight: 10,
    },
    submitButton: {
        backgroundColor: '#1892e5',
        marginLeft: 10,
    },
    reuploadButtonText: {
        color: '#1892e5',
        fontSize: 15,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 15,
    },
    qrcode: {
        width: 200,
        height: 200,
        alignSelf: 'center',
        marginVertical: 20,
    },
    exampleImage: {
        width: '100%',
        height: 150,
        marginVertical: 10,
        borderRadius: 4,
    },
}); 