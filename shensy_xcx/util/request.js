import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import globalData from './globalData';
var CryptoJS = require("crypto-js")

// post参数签名
const signPost = (url, jsonData) => {
    try {
        const signStr = jsonData + '@' + url;
        const hmac = CryptoJS.HmacSHA256(signStr, globalData.appSecret);
        return hmac.toString(CryptoJS.enc.Hex);
    } catch (error) {
        throw error;
    }
};

// get参数签名
const signGet = (url, params) => {
    const keys = Object.keys(params).sort();
    let data = '';
    keys.forEach(key => {
        data += key + '=' + params[key] + '&';
    });
    data = data.slice(0, -1);
    data = data + '@' + url;
    const hmac = CryptoJS.HmacSHA256(data, globalData.appSecret);
    return hmac.toString(CryptoJS.enc.Hex);
};

// 网络请求工具类
const request = {
    // 获取token
    async getToken() {
        try {
            return await AsyncStorage.getItem(globalData.LoginAccessTokenKey);
        } catch (error) {
            return null;
        }
    },

    // 获取token过期时间
    async getTokenExpireTime() {
        try {
            const expireTime = await AsyncStorage.getItem(globalData.LoginExpiresInKey);
            return expireTime ? parseInt(expireTime) : 0;
        } catch (error) {
            return 0;
        }
    },

    // 判断token是否过期
    async isTokenExpired() {
        const curTime = new Date().getTime();
        const expiresIn = await this.getTokenExpireTime();
        return curTime > expiresIn;
    },

    // 判断是否需要token验证
    needlessAuth(url) {
        return [
            "/app_driver/base/login",
            "/app_driver/base/register",
            "/app_driver/base/send_login_sms",
            "/app_driver/base/send_register_sms",
            "/test/check_login"
        ].includes(url);
    },

    // 跳转到登录页
    goToLogin(message = '登录状态已过期，请重新登录') {
        AsyncStorage.clear();
        Alert.alert('提示', message, [
            {
                text: '确定',
                onPress: () => {
                    global.navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        })
                    );
                }
            }
        ]);
    },

    // 请求模型
    async requestModel({ method, url, params, loading = false }) {
        const token = await this.getToken();
        const jsonData = JSON.stringify(params);

        const signature = method.toUpperCase() === 'GET' ?
            signGet(url, params) :
            signPost(url, jsonData);

        let fullUrl = url;
        if (method.toUpperCase() === 'GET' && Object.keys(params).length > 0) {
            const queryString = Object.keys(params)
                .sort()
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join('&');
            fullUrl = `${url}?${queryString}`;
        }

        const headers = {
            'Content-Type': 'application/json',
            'x-token': token,
            'x-signature': signature
        };

        try {
            if (loading) {
                global.loadingRef?.show();
            }

            const response = await fetch(globalData.baseUrl + fullUrl, {
                method,
                headers,
                body: method.toUpperCase() === 'GET' ? undefined : jsonData,
            });

            if (loading) {
                global.loadingRef?.hide();
            }

            const responseData = await response.json();

            switch (response.status) {
                case 200:
                    const newToken = response.headers.get('new-token');
                    const newExpiresAt = response.headers.get('new-expires-at');
                    if (newToken) {
                        await AsyncStorage.setItem(globalData.LoginAccessTokenKey, newToken);
                        await AsyncStorage.setItem(globalData.LoginExpiresInKey, newExpiresAt);
                    }
                    return responseData;

                case 401:
                    this.goToLogin();
                    throw new Error('登录状态过期');

                case 400:
                    throw new Error(responseData?.msg || '请求参数错误');

                case 500:
                    throw new Error('服务器异常，稍后重试');

                default:
                    throw new Error(`请求失败: ${response.status}`);
            }

        } catch (error) {
            if (loading) {
                global.loadingRef?.hide();
            }
            throw error;
        }
    },

    // GET请求
    async get(url, params = {}, loading = false) {
        const isExpired = await this.isTokenExpired();
        const needAuth = !this.needlessAuth(url);

        if (isExpired && needAuth) {
            this.goToLogin();
            return;
        }

        const validParams = {};
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                validParams[key] = params[key];
            }
        });

        try {
            const result = await this.requestModel({
                method: 'GET',
                url,
                params: validParams,
                loading
            });
            return result;
        } catch (error) {
            throw error;
        }
    },

    // POST请求
    async post(url, data = {}, loading = false) {
        const isExpired = await this.isTokenExpired();
        const needAuth = !this.needlessAuth(url);

        if (isExpired && needAuth) {
            this.goToLogin();
            return;
        }

        return this.requestModel({
            method: 'POST',
            url,
            params: data,
            loading
        });
    }
};

export default request; 