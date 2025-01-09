import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ImagePreview = ({ visible, images = [], onClose }) => {
    // 处理图片数据格式
    const processedImages = images.map(image => {
        // 如果 image 是字符串，直接作为 url 使用
        if (typeof image === 'string') {
            return {
                url: image.startsWith('http') 
                    ? image 
                    : `https://test-shensy-obs.ship56.net/${image}`
            };
        }
        // 如果 image 是对象且有 url 属性
        if (image && image.url) {
            return {
                url: image.url.startsWith('http') 
                    ? image.url 
                    : `https://test-shensy-obs.ship56.net/${image.url}`
            };
        }
        // 如果都不是，返回一个空的占位图
        return {
            url: 'https://test-shensy-obs.ship56.net/placeholder.png'
        };
    });

    return (
        <Modal visible={visible} transparent={true}>
            <View style={styles.container}>
                <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={onClose}
                >
                    <MaterialCommunityIcons 
                        name="close" 
                        size={24} 
                        color="#fff" 
                    />
                </TouchableOpacity>
                <ImageViewer
                    imageUrls={processedImages}
                    enableSwipeDown={true}
                    onSwipeDown={onClose}
                    saveToLocalByLongPress={false}
                    backgroundColor="rgba(0,0,0,0.9)"
                    renderIndicator={() => null}
                    footerContainerStyle={styles.footerContainer}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 999,
        padding: 10,
    },
    footerContainer: {
        bottom: 60,
    },
});

export default ImagePreview; 