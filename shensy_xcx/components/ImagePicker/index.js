import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import config from '../../util/config';
import request from '../../util/request';
import toast from '../../util/toast';
import ImagePreview from '../ImagePreview';

const ImagePicker = ({
    files = [],
    onUpload,
    onDelete,
    showDelete = false,
    disabled = false
}) => {
    // 使用 files 来控制显示，不再使用内部状态
    const currentImage = files[0]?.url || null;

    const [previewVisible, setPreviewVisible] = useState(false);

    // 获取完整的图片 URL
    const getFullImageUrl = (url) => {
        if (!url) return '';
        return url.startsWith('http') 
            ? url 
            : `https://test-shensy-obs.ship56.net/${url}`;
    };

    // 请求权限
    const requestPermissions = async () => {
        try {
            const { status: cameraStatus } = await ExpoImagePicker.requestCameraPermissionsAsync();
            const { status: libraryStatus } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();

            if (cameraStatus !== 'granted') {
                toast.show('需要相机权限才能继续');
                return false;
            }
            if (libraryStatus !== 'granted') {
                toast.show('需要访问相册权限才能继续');
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    };

    // 处理图片上传
    const handleUploadImage = async (result) => {
        if (!result.canceled && result.assets[0]) {
            try {
                const file = result.assets[0];
                const fileExtension = file.uri.split('.').pop().toLowerCase();
                
                if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                    toast.show('不支持的文件格式');
                    return;
                }

                // 获取 OSS 配置
                const ossConfig = await config.getOssMess(fileExtension);
                if (!ossConfig.isSucc) {
                    toast.show('获取上传配置失败');
                    return;
                }

                // 上传到 OSS
                config.ossUpLoadFileRequest(
                    'image',
                    '上传中...',
                    file.uri,
                    {},
                    'upload',
                    async (data) => {
                        if (data.statusCode === 204) {
                            try {
                                // 获取图片 URL
                                const res = await request.get('/app_driver/obs/getObsUrl', {
                                    obs_key: ossConfig.ossParam.DirKey
                                });

                                if (res.code === 0) {
                                    onUpload({
                                        obs_url: res.data.url_key,
                                        obs_url_text: `${ossConfig.ossParam.Host}/${res.data.url_key}`
                                    });
                                } else {
                                    toast.show(res.msg || '获取图片URL失败');
                                }
                            } catch (error) {
                                toast.show('获取图片URL失败');
                            }
                        } else {
                            toast.show('上传失败');
                        }
                    },
                    (error) => {
                        toast.show('上传失败');
                    }
                );
            } catch (error) {
                toast.show('上传失败');
            }
        }
    };

    // 从相册选择
    const handleChooseFromLibrary = async () => {
        const result = await ExpoImagePicker.launchImageLibraryAsync({
            mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 1,
        });
        await handleUploadImage(result);
    };

    // 拍照
    const handleTakePhoto = async () => {
        const result = await ExpoImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [3, 4],
            quality: 1,
        });
        await handleUploadImage(result);
    };

    // 显示选择方式
    const handleChooseImage = async () => {
        if (disabled) return;

        const hasPermissions = await requestPermissions();
        if (!hasPermissions) return;

        Alert.alert(
            '选择图片',
            '请选择获取图片方式',
            [
                {
                    text: '拍照',
                    onPress: handleTakePhoto
                },
                {
                    text: '从相册选择',
                    onPress: handleChooseFromLibrary
                },
                {
                    text: '取消',
                    style: 'cancel'
                }
            ]
        );
    };

    // 处理删除
    const handleDelete = () => {
        Alert.alert(
            '提示',
            '确定要删除这张图片吗？',
            [
                {
                    text: '取消',
                    style: 'cancel'
                },
                {
                    text: '确定',
                    onPress: () => onDelete?.()
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {currentImage ? (
                <View style={styles.imageContainer}>
                    <TouchableOpacity 
                        style={styles.imageWrapper}
                        onPress={() => setPreviewVisible(true)}
                    >
                        <Image
                            source={{ uri: getFullImageUrl(currentImage) }}
                            style={styles.image}
                        />
                    </TouchableOpacity>
                    {showDelete && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={handleDelete}
                        >
                            <MaterialCommunityIcons
                                name="close-circle"
                                size={20}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <TouchableOpacity
                    style={[
                        styles.uploadButton,
                        disabled && styles.uploadButtonDisabled
                    ]}
                    onPress={handleChooseImage}
                    disabled={disabled}
                >
                    <MaterialCommunityIcons
                        name="plus"
                        size={24}
                        color={disabled ? "#999" : "#666"}
                    />
                </TouchableOpacity>
            )}

            <ImagePreview
                visible={previewVisible}
                images={currentImage ? [currentImage] : []}
                onClose={() => setPreviewVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 73,
        height: 73,
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    imageWrapper: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    uploadButton: {
        width: '100%',
        height: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fafafa',
    },
    uploadButtonDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#eee',
    },
    deleteButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
    },
});

export default ImagePicker; 