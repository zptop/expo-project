import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImagePreview = ({ visible, imageUrl, onClose }) => {
    if (!visible || !imageUrl) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={onClose}
                >
                    <MaterialCommunityIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.imageContainer}
                    onPress={onClose}
                >
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
        padding: 10,
    },
    imageContainer: {
        width: screenWidth,
        height: screenHeight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: screenWidth,
        height: screenHeight * 0.8,
    },
});

export default ImagePreview; 