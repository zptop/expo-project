import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Router from './router';
import Loading from './components/Loading';
import { RootSiblingParent } from 'react-native-root-siblings';

export default function App() {
    const loadingRef = useRef();
    const navigationRef = useRef();

    return (
        <RootSiblingParent>
            <NavigationContainer
                ref={navigationRef}
                onReady={() => {
                    global.navigation = navigationRef.current;
                }}
            >
                <Router />
                <Loading ref={ref => {
                    loadingRef.current = ref;
                    global.loadingRef = ref;
                }} />
            </NavigationContainer>
        </RootSiblingParent>
    );
}
