import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import toast from '../../../util/toast';
import request from '../../../util/request';
import AsyncStorage from '@react-native-async-storage/async-storage';
import globalData from '../../../util/globalData';

export default function Login({ navigation }) {
    const [mobile, setMobile] = useState('13714513457');
    const [sms_code, setSmsCode] = useState('6688');
    const [countdown, setCountdown] = useState(0);

    // 发送验证码
    const handleSendCode = async () => {
        if (!mobile) {
            toast.show('请输入手机号');
            return;
        } else if (!/^1[3-9]\d{9}$/.test(mobile)) {
            toast.show('请输入正确的手机号');
            return;
        }

        try {
            // 调用发送验证码接口
            const res = await request.post('/app_driver/base/send_login_sms', {
                mobile
            }, true);

            if (res.code === 0) {
                toast.success('验证码已发送');
                // 开始倒计时
                setCountdown(60);
                const timer = setInterval(() => {
                    setCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                toast.show(res.msg || '发送验证码失败');
            }
        } catch (error) {
            toast.show(error.message || '发送验证码失败');
        }
    };

    // 登录
    const handleLogin = async () => {
        if (!mobile) {
            toast.show('请输入手机号');
            return;
        } else if (!/^1[3-9]\d{9}$/.test(mobile)) {
            toast.show('请输入正确的手机号');
            return;
        }
        if (!sms_code) {
            toast.show('请输入验证码');
            return;
        }

        try {
            // 调用登录接口
            const res = await request.post('/app_driver/base/login', {
                mobile,
                sms_code
            }, true);

            console.log('Login response:', res);

            if (res.code === 0) {
                // 保存token和过��时间
                await AsyncStorage.setItem(globalData.LoginAccessTokenKey, res.data.token);
                await AsyncStorage.setItem(
                    globalData.LoginExpiresInKey, 
                    (Date.now() + res.data.expires_in * 1000).toString()
                );
                
                navigation.replace('Main', {
                    screen: 'Waybill'
                });
            } else {
                toast.show(res.msg || '登录失败');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.show(error.message || '登录失败');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.content}>
                {/* Logo */}
                <Image
                    source={require('../../../assets/shensy_driver_xcx_images/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* 手机号输入 */}
                <View style={styles.inputContainer}>
                    <Image
                        source={require('../../../assets/shensy_driver_xcx_images/user.png')}
                        style={styles.inputIcon}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="请输入手机号"
                        value={mobile}
                        onChangeText={setMobile}
                        keyboardType="phone-pad"
                        maxLength={11}
                    />
                </View>

                {/* 验证码输入 */}
                <View style={styles.inputContainer}>
                    <Image
                        source={require('../../../assets/shensy_driver_xcx_images/code-msg.png')}
                        style={styles.inputIcon}
                    />
                    <TextInput
                        style={styles.codeInput}
                        placeholder="请输入短信验证码"
                        value={sms_code}
                        onChangeText={setSmsCode}
                        keyboardType="number-pad"
                        maxLength={6}
                    />
                    <TouchableOpacity
                        style={[styles.codeButton, countdown > 0 && styles.codeButtonDisabled]}
                        onPress={handleSendCode}
                        disabled={countdown > 0}
                    >
                        <Text style={styles.codeButtonText}>
                            {countdown > 0 ? `${countdown}s` : '发送验证码'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 登录按钮 */}
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                >
                    <Text style={styles.loginButtonText}>登录</Text>
                </TouchableOpacity>

                {/* 注册链接 - 修改为靠左对齐 */}
                <View style={styles.registerContainer}>
                    <TouchableOpacity
                        style={styles.registerLink}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.registerText}>
                            新用户还没有账号？
                            <Text style={styles.registerHighlight}>注册</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 80,
        marginTop: 60,
        marginBottom: 40,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    inputIcon: {
        width: 16,
        height: 16,
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 16,
    },
    codeContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    codeInput: {
        flex: 1,
        height: 44,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        fontSize: 16,
    },
    codeButton: {
        marginLeft: 10,
        paddingHorizontal: 15,
        height: 32,
        backgroundColor: '#00A870',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    codeButtonDisabled: {
        backgroundColor: '#ccc',
    },
    codeButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    loginButton: {
        width: '100%',
        height: 44,
        backgroundColor: '#003B90',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    registerContainer: {
        width: '100%',
        alignItems: 'flex-start', // 靠左对齐
        marginTop: 15,
    },
    registerLink: {
        alignSelf: 'flex-start', // 靠左对齐
    },
    registerText: {
        fontSize: 14,
        color: '#666',
    },
    registerHighlight: {
        color: '#003B90',
    }
}); 