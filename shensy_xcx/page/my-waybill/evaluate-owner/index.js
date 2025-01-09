import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image,TextInput, ScrollView, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import request from '../../../util/request';
import toast from '../../../util/toast';

// 评分映射
const scoreMap = new Map([
    [1, '差评'],
    [2, '差评'],
    [3, '一般'],
    [4, '满意'],
    [5, '满意'],
]);

// 添加 Star 组件
const Star = ({ filled, onPress }) => (
    <TouchableOpacity onPress={onPress}>
        <MaterialCommunityIcons
            name={filled ? "star" : "star-outline"}
            size={30}
            color={filled ? "#f7ba2a" : "#ddd"}
        />
    </TouchableOpacity>
);

// 添加 Rating 组件
const Rating = ({ rating, onRatingChange }) => {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    filled={star <= rating}
                    onPress={() => onRatingChange(star)}
                />
            ))}
        </View>
    );
};

export default function EvaluateOwner({ route, navigation }) {
    const { waybill_id } = route.params;
    const [userInfo, setUserInfo] = useState({});
    const [score, setScore] = useState(0);
    const [scoreText, setScoreText] = useState('未打分');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [content, setContent] = useState('');
    const [tags, setTags] = useState([
        { text: '准时', isOn: false },
        { text: '规范专业', isOn: false },
        { text: '守信用', isOn: false }
    ]);

    // 获取货主信息
    const getOwnerInfo = async () => {
        try {
            const res = await request.get('/app_driver/evaluate/getEmployeeInfo', {
                waybill_id
            });
            if (res.code === 0) {
                setUserInfo(res.data);
            } else {
                toast.show(res.msg);
            }
        } catch (error) {
            console.error('获取货主信息失败:', error);
            toast.show('获取货主信息失败');
        }
    };

    // 评分改变
    const handleRatingChange = (rating) => {
        setScore(rating);
        setScoreText(scoreMap.get(rating) || '未打分');
    };

    // 标签点击
    const handleTagPress = (index) => {
        const newTags = [...tags];
        newTags[index].isOn = true;
        setTags(newTags);
        setContent((prev) => prev + ' ' + newTags[index].text);
    };

    // 清空评价内容
    const clearContent = () => {
        setTags(tags.map(tag => ({ ...tag, isOn: false })));
        setContent('');
    };

    // 提交评价
    const handleSubmit = async () => {
        if (score === 0) {
            toast.show('评分不能为空');
            return;
        }

        try {
            const res = await request.post('/app_driver/evaluate/evaluateEmployee', {
                waybill_id: Number(waybill_id),
                evaluate_content: content,
                evaluate_score: score
            });

            if (res.code === 0) {
                toast.show(res.msg || '评价成功');
                navigation.goBack();
            } else {
                toast.show(res.msg);
            }
        } catch (error) {
            console.error('评价失败:', error);
            toast.show('评价失败');
        }
    };

    useEffect(() => {
        if (waybill_id) {
            getOwnerInfo();
        }
    }, [waybill_id]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <MaterialCommunityIcons
                            name="account"
                            size={40}
                            color="#4CAF50"
                        />
                        <View style={styles.userDetail}>
                            <Text style={styles.userName}>{userInfo.code || 'deepin123456'}</Text>
                            <View style={styles.tags}>
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>本人认证</Text>
                                </View>
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>公司认证</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.scoreContainer}>
                            <View style={styles.scoreWrapper}>
                                <Image
                                    source={require('../../../assets/shensy_driver_xcx_images/d-14.png')}
                                    style={styles.starIcon}
                                />
                                <Text style={styles.scoreNumber}>5</Text>
                            </View>
                            <Text style={styles.scoreText}>平均</Text>
                        </View>
                    </View>

                    <View style={styles.ratingContainer}>
                        <Rating
                            rating={score}
                            onRatingChange={handleRatingChange}
                        />
                        <Text style={styles.ratingText}>{scoreText}</Text>
                    </View>

                    <View style={styles.tagsContainer}>
                        {tags.map((tag, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.evaluateTag, tag.isOn && styles.evaluateTagActive]}
                                onPress={() => handleTagPress(index)}
                            >
                                <Text style={[styles.evaluateTagText, tag.isOn && styles.evaluateTagTextActive]}>
                                    {tag.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput
                        style={styles.input}
                        multiline
                        numberOfLines={4}
                        placeholder="说说货主怎么样，分享给其他司机"
                        value={content}
                        onChangeText={setContent}
                    />

                    <TouchableOpacity
                        style={styles.anonymousContainer}
                        onPress={() => setIsAnonymous(!isAnonymous)}
                    >
                        <MaterialCommunityIcons
                            name={isAnonymous ? "checkbox-marked" : "checkbox-blank-outline"}
                            size={24}
                            color="#1892e5"
                        />
                        <Text style={styles.anonymousText}>匿名发表评论</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
            >
                <Text style={styles.submitButtonText}>提交评价</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6f7',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: '#fff',
        padding: 15,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    userDetail: {
        flex: 1,
        marginLeft: 10,
    },
    userName: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
    },
    tags: {
        flexDirection: 'row',
    },
    tag: {
        backgroundColor: '#f0f9eb',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 2,
        marginRight: 8,
    },
    tagText: {
        fontSize: 12,
        color: '#67c23a',
    },
    scoreContainer: {
        alignItems: 'center',
    },
    scoreWrapper: {
        position: 'relative',
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    starIcon: {
        width: 50,
        height: 50,
        position: 'absolute',
        top: 0,
        left: 0,
    },
    scoreNumber: {
        fontSize: 16,
        color: '#fff',
        zIndex: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
        lineHeight: 16,
    },
    scoreText: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    ratingContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    ratingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
    },
    evaluateTag: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 4,
        marginRight: 10,
        marginBottom: 10,
    },
    evaluateTagActive: {
        backgroundColor: '#e6f7ff',
    },
    evaluateTagText: {
        fontSize: 14,
        color: '#666',
    },
    evaluateTagTextActive: {
        color: '#1892e5',
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
        padding: 10,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 15,
    },
    anonymousContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    anonymousText: {
        marginLeft: 5,
        fontSize: 14,
        color: '#666',
    },
    submitButton: {
        backgroundColor: '#1892e5',
        margin: 15,
        height: 44,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        color: '#fff',
    },
}); 