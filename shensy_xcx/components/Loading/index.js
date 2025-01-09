import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';

const Loading = forwardRef((props, ref) => {
    const [visible, setVisible] = useState(false);

    useImperativeHandle(ref, () => ({
        show: () => setVisible(true),
        hide: () => setVisible(false)
    }));

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={() => setVisible(false)}
        >
            <View style={styles.container}>
                <View style={styles.content}>
                    <ActivityIndicator size="large" color="#003B90" />
                </View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 8,
    }
});

export default Loading; 