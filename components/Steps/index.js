import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const Steps = ({ steps, activeStep }) => {
    return (
        <View style={styles.container}>
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    {/* 连接线 */}
                    {index > 0 && (
                        <View style={[
                            styles.line,
                            index <= activeStep && styles.activeLine
                        ]} />
                    )}
                    
                    {/* 步骤点 */}
                    <View style={[
                        styles.step,
                        index <= activeStep && styles.activeStep
                    ]}>
                        <Text style={[
                            styles.stepText,
                            index <= activeStep && styles.activeStepText
                        ]}>
                            {step.text}
                        </Text>
                    </View>
                </React.Fragment>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        backgroundColor: '#fff',
    },
    step: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeStep: {
        backgroundColor: '#1892e5',
        borderColor: '#1892e5',
    },
    stepText: {
        fontSize: 12,
        color: '#999',
    },
    activeStepText: {
        color: '#fff',
    },
    line: {
        height: 1,
        width: 100,
        backgroundColor: '#ddd',
    },
    activeLine: {
        backgroundColor: '#1892e5',
    },
}); 