import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RoleGate from './RoleGate';

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RoleGate />
    </NavigationContainer>
  );
}
