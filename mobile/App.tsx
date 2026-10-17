import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import WasteNavigator from './src/navigation/WasteNavigator';
import { tokenStorage } from './src/services/tokenStorage';

// LOCAL TESTING ONLY. Do not commit this file.
// Waits for AuthProvider's session restore to finish (it clears tokens when
// /users/me fails against my temporary users table), then saves the dev token.
function DevGate() {
  const { status } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    (async () => {
      const t = process.env.EXPO_PUBLIC_DEV_TOKEN;
      if (t) await tokenStorage.saveTokens(t, 'dev-refresh');
      setReady(true);
    })();
  }, [status]);

  if (!ready) return null;

  return (
    <NavigationContainer>
      <WasteNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DevGate />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}