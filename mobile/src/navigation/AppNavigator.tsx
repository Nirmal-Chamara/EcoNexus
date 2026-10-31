import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RoleNavigator from './RoleNavigator';

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RoleNavigator />
    </NavigationContainer>
  );
}
