import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import request from '../../../util/request';
import toast from '../../../util/toast';

export default function ModifyMobile({ navigation }) {
    const [mobile, setMobile] = useState('');
    const [smsCode, setSmsCode] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [btnText, setBtnText] = useState('发送验证码');

    // 验证手机号格式
    const validateMobile = (phone) => {
        return /^1[3456789]\d{9}$/.test(phone);
    };

    // 发送验证码
    const handleSendCode = async () => {
        if (!mobile) {
            toast.show('请输入新的手机号');
            return;
        }
        if (!validateMobile(mobile)) {
            toast.show('手机号格式不正确');
            return;
        }

        try {
            const res = await request.post('/app_driver/user/sendChgMobileSms', {
                mobile
            });

            if (res.code === 0) {
                toast.show('发送成功');
                // 开始倒计时
                setCountdown(60);
                startCountdown();
            } else {
                toast.show(res.msg);
            }
        } catch (error) {
            toast.show('发送失败');
        }
    };

    // 倒计时
    const startCountdown = () => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setBtnText('重发验证码');
                    return 0;
                }
                setBtnText(`剩余${prev - 1}秒`);
                return prev - 1;
            });
        }, 1000);
    };

    // 确认修改
    const handleSubmit = async () => {
        if (!mobile) {
            toast.show('请输入新的手机号');
            return;
        }
        if (!smsCode) {
            toast.show('请输入短信验证码');
            return;
        }

        try {
            const res = await request.post('/app_driver/user/chgUserMobile', {
                mobile,
                sms_code: smsCode
            });

            if (res.code === 0) {
                toast.show('修改成功');
                navigation.goBack();
            } else {
                toast.show(res.msg || '修改失败');
            }
        } catch (error) {
            toast.show('修改失败');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* 手机号输入 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.required}>*</Text>
                    <Text style={styles.label}>新的手机号</Text>
                    <TextInput
                        style={styles.input}
                        value={mobile}
                        onChangeText={setMobile}
                        placeholder="请输入新的手机号"
                        keyboardType="phone-pad"
                        maxLength={11}
                    />
                </View>

                {/* 验证码输入 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.required}>*</Text>
                    <Text style={styles.label}>短信验证码</Text>
                    <View style={styles.codeContainer}>
                        <TextInput
                            style={[styles.input, styles.codeInput]}
                            value={smsCode}
                            onChangeText={setSmsCode}
                            placeholder="请输入5位短信验证码"
                            keyboardType="number-pad"
                            maxLength={5}
                        />
                        <TouchableOpacity
                            style={[
                                styles.codeButton,
                                countdown > 0 && styles.codeButtonDisabled
                            ]}
                            onPress={handleSendCode}
                            disabled={countdown > 0}
                        >
                            <Text style={styles.codeButtonText}>{btnText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* 确认修改按钮 */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                >
                    <Text style={styles.submitButtonText}>确定修改</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    required: {
        color: '#ff4d4f',
        marginRight: 2,
    },
    label: {
        width: 80,
        fontSize: 14,
        color: '#333',
    },
    input: {
        flex: 1,
        height: 40,
        fontSize: 14,
        color: '#333',
        padding: 0,
    },
    codeContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    codeInput: {
        flex: 1,
        marginRight: 10,
    },
    codeButton: {
        backgroundColor: '#1892e5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    codeButtonDisabled: {
        backgroundColor: '#ccc',
    },
    codeButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    buttonContainer: {
        padding: 15,
        paddingBottom: Platform.OS === 'ios' ? 0 : 15,
    },
    submitButton: {
        height: 50,
        backgroundColor: '#1892e5',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
    },
}); 