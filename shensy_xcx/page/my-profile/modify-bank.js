import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    SafeAreaView,
    Platform 
} from 'react-native';
import request from '../../util/request';
import toast from '../../util/toast';

export default function ModifyBank({ navigation }) {
    const [bankInfo, setBankInfo] = useState({
        bank_card_no: '',
        bank_name: ''
    });

    const handleInputChange = (name, value) => {
        setBankInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        const { bank_card_no, bank_name } = bankInfo;

        if (!bank_card_no) {
            toast.show('请输入新的银行卡号');
            return;
        }
        if (!bank_name) {
            toast.show('请输入开户银行');
            return;
        }

        try {
            const res = await request.post('/app_driver/user/exchangeUserInfo', {
                ...bankInfo,
                chg_type: 2
            });

            toast.show(res.msg || (res.code === 0 ? '修改成功' : '修改失败'));
            
            if (res.code === 0) {
                navigation.goBack();
            }
        } catch (error) {
            toast.show('修改失败');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.formItem}>
                    <Text style={styles.required}>*</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="请输入新的银行卡号"
                        value={bankInfo.bank_card_no}
                        onChangeText={(value) => handleInputChange('bank_card_no', value)}
                        keyboardType="number-pad"
                        placeholderTextColor="#999"
                    />
                </View>
                <View style={styles.formItem}>
                    <Text style={styles.required}>*</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="请输入开户银行"
                        value={bankInfo.bank_name}
                        onChangeText={(value) => handleInputChange('bank_name', value)}
                        placeholderTextColor="#999"
                    />
                </View>
            </View>
            
            <SafeAreaView style={styles.bottomContainer}>
                <TouchableOpacity 
                    style={styles.submitButton}
                    onPress={handleSubmit}
                >
                    <Text style={styles.submitButtonText}>保存</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        flex: 1,
    },
    formItem: {
        backgroundColor: '#fff',
        marginBottom: 1,
        height: 50,
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
    },
    required: {
        color: '#FF4D4F',
        fontSize: 16,
        marginLeft: 15,
        marginRight: 5,
    },
    input: {
        flex: 1,
        height: '100%',
        paddingRight: 15,
        fontSize: 14,
        color: '#333',
    },
    bottomContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 0 : 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E5E5E5',
    },
    submitButton: {
        height: 44,
        backgroundColor: '#1890FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
}); 