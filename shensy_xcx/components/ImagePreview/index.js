import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImagePreview = ({ visible, images = [], onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!visible || !images.length) return null;

    const renderItem = ({ item }) => (
        <TouchableOpacity
            activeOpacity={1}
            style={styles.imageContainer}
            onPress={onClose}
        >
            <Image
                source={{ uri: item }}
                style={styles.image}
                resizeMode="contain"
            />
        </TouchableOpacity>
    );

    const onScroll = (event) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        setCurrentIndex(roundIndex);
    };

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
                
                <FlatList
                    data={images}
                    renderItem={renderItem}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={onScroll}
                    keyExtractor={(item, index) => index.toString()}
                />

                {images.length > 1 && (
                    <View style={styles.pagination}>
                        {images.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.paginationDot,
                                    currentIndex === index && styles.paginationDotActive
                                ]}
                            />
                        ))}
                    </View>
                )}
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
    pagination: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: '#fff',
    },
});

export default ImagePreview; 