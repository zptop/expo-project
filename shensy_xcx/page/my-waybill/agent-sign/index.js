import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, SafeAreaView } from 'react-native';
import request from '../../../util/request';
import toast from '../../../util/toast';

export default function AgentSign({ navigation }) {
    const [agentUrl, setAgentUrl] = useState('');

    // 获取代征协议页面 URL
    const getUserAgent = async () => {
        try {
            const res = await request.get('/app_driver/user/getUserAgent', {}, true);
            if (res.code === 0 && res.data) {
                setAgentUrl(res.data.agent_page);
            } else {
                toast.show(res.msg || '获取代征协议页面失败');
                navigation.goBack();
            }
        } catch (error) {
            toast.show('获取代征协议页面失败');
            navigation.goBack();
        }
    };

    useEffect(() => {
        getUserAgent();
    }, []);

    if (!agentUrl) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            <WebView
                source={{ uri: agentUrl }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
}); 