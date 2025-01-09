import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Modal from 'react-native-modal';

const Dialog = ({ 
    visible, 
    title, 
    data = [], 
    onCancel, 
    onConfirm 
}) => {
    // 添加选中状态管理
    const [selectedItem, setSelectedItem] = React.useState(null);

    // 处理选项点击
    const handleItemPress = (item) => {
        setSelectedItem(item);
    };

    // 处理确认按钮点击
    const handleConfirm = () => {
        if (selectedItem) {
            onConfirm(selectedItem.label, selectedItem.value);
        } else if (data.length > 0) {
            // 如果没有选中项，默认选择第一项
            onConfirm(data[0].label, data[0].value);
        }
    };

    return (
        <Modal
            isVisible={visible}
            style={styles.modal}
            backdropOpacity={0.5}
            onBackdropPress={onCancel}
            swipeDirection="down"
            onSwipeComplete={onCancel}
            propagateSwipe={true}
            animationIn="slideInUp"
            animationOut="slideOutDown"
        >
            <View style={styles.container}>
                {/* 标题栏 */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onCancel}>
                        <Text style={styles.cancelText}>取消</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{title}</Text>
                    <TouchableOpacity onPress={handleConfirm}>
                        <Text style={styles.confirmText}>确定</Text>
                    </TouchableOpacity>
                </View>

                {/* 选项列表 */}
                <ScrollView style={styles.content}>
                    {data.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.item,
                                selectedItem?.value === item.value && styles.selectedItem
                            ]}
                            onPress={() => handleItemPress(item)}
                        >
                            <Text style={[
                                styles.itemText,
                                selectedItem?.value === item.value && styles.selectedItemText
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        margin: 0,
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        maxHeight: '70%',
        minHeight: '24%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        flex: 1,
        textAlign: 'center',
    },
    cancelText: {
        fontSize: 14,
        color: '#999',
        paddingHorizontal: 15,
        width: 60,
    },
    confirmText: {
        fontSize: 14,
        color: '#1892e5',
        paddingHorizontal: 15,
        width: 60,
        textAlign: 'right',
    },
    content: {
        maxHeight: 300,
    },
    item: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    selectedItem: {
        backgroundColor: '#f5f5f5',
    },
    itemText: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
    selectedItemText: {
        color: '#1892e5',
    },
});

export default Dialog; 