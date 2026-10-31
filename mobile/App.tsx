import React from 'react';
import { DevSettings, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import NetworkStatusBanner from './src/components/common/NetworkStatusBanner';
import ThemePreviewScreen from './src/screens/dev/ThemePreviewScreen';
import ComponentGalleryScreen from './src/screens/dev/ComponentGalleryScreen';

/**
 * EcoNexus App Root
 *
 * Provider hierarchy (outermost → innermost):
 *   SafeAreaProvider    — native safe area insets for all screens
 *   AuthProvider        — global auth state, session restoration, force-logout
 *   RootNavigator       — auth flow and role-based navigation
 */
export default function App() {
  const [showTokens, setShowTokens] = React.useState(false);
  const [showComponents, setShowComponents] = React.useState(false);

  React.useEffect(() => {
    if (__DEV__) {
      DevSettings.addMenuItem('EcoNexus design tokens', () => setShowTokens(true));
      DevSettings.addMenuItem('EcoNexus component gallery', () => setShowComponents(true));
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NetworkStatusBanner />
        <RootNavigator />
        <StatusBar style="light" />
      </AuthProvider>
      {__DEV__ && (
        <Modal visible={showComponents} onRequestClose={() => setShowComponents(false)}>
          <SafeAreaProvider>
            <ComponentGalleryScreen onClose={() => setShowComponents(false)} />
            <StatusBar style="light" />
          </SafeAreaProvider>
        </Modal>
      )}
      {__DEV__ && (
        <Modal visible={showTokens} onRequestClose={() => setShowTokens(false)}>
          <SafeAreaProvider>
            <ThemePreviewScreen onClose={() => setShowTokens(false)} />
            <StatusBar style="dark" />
          </SafeAreaProvider>
        </Modal>
      )}
    </SafeAreaProvider>
  );
}
