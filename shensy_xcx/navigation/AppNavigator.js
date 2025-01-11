import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Copyright from '../page/settings/Copyright';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Copyright" 
        component={Copyright}
        options={{
          title: '版权所有',
          headerTitleAlign: 'center',
        }}
      />
    </Stack.Navigator>
  );
} 