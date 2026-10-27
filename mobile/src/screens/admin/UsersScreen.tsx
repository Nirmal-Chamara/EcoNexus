import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/** Placeholder — will be implemented in a future phase */
export default function UsersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>UsersScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0F0D' },
  text:      { color: '#A7F3D0', fontSize: 16 },
});
