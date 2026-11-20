import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Input,
  PasswordInput,
  Checkbox,
  SegmentedTabs,
  Card,
  Chip,
  Avatar,
  Toast,
  Loader,
  EmptyState,
  ScreenContainer,
} from '../../components/ui';
import type { StatusTone } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';

const tabs = [
  { value: 'login', label: 'Sign In' },
  { value: 'register', label: 'Create Account' },
] as const;
const tones: StatusTone[] = ['success', 'error', 'warning', 'info', 'neutral'];

function Heading({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={styles.heading}>
      {children}
    </Text>
  );
}

export default function ComponentGalleryScreen({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState(false);
  const dismiss = useCallback(() => setToast(false), []);
  return (
    <ScreenContainer>
      <Button title="Close gallery" variant="ghost" onPress={onClose} />
      <Text accessibilityRole="header" style={styles.title}>
        Core components
      </Text>
      <Heading>Buttons</Heading>
      {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
        <View key={variant} style={styles.group}>
          <Button title={variant} variant={variant} onPress={() => setToast(true)} />
          <Button title={`${variant} loading`} variant={variant} loading />
          <Button title={`${variant} disabled`} variant={variant} disabled />
        </View>
      ))}
      <Heading>Inputs</Heading>
      <Input
        label="Email"
        icon="mail-outline"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input label="Valid email" icon="mail-outline" defaultValue="hello@example.com" valid />
      <Input label="Invalid email" defaultValue="hello" error="Enter a valid email address." />
      <Input label="Disabled email" value="hello@example.com" editable={false} />
      <PasswordInput
        label="Password"
        placeholder="Enter password"
        value={password}
        onChangeText={setPassword}
      />
      <PasswordInput
        label="Invalid password"
        defaultValue="short"
        error="Use at least 8 characters."
      />
      <PasswordInput label="Valid password" defaultValue="Example123!" valid />
      <PasswordInput label="Disabled password" value="Example123!" editable={false} />
      <Heading>Checkboxes</Heading>
      <Checkbox label="Keep me signed in" checked={checked} onChange={setChecked} />
      <Checkbox label="Selected" checked={!checked} onChange={(value) => setChecked(!value)} />
      <Checkbox label="Disabled unchecked" checked={false} disabled onChange={setChecked} />
      <Checkbox label="Disabled checked" checked disabled onChange={setChecked} />
      <Heading>Segmented tabs</Heading>
      <SegmentedTabs options={tabs} value={tab} onChange={setTab} />
      <SegmentedTabs options={tabs} value="login" onChange={setTab} disabled />
      <SegmentedTabs
        options={[tabs[0], { ...tabs[1], disabled: true }]}
        value="login"
        onChange={setTab}
      />
      <Heading>Cards</Heading>
      <Card>
        <Text style={styles.text}>Standard card</Text>
      </Card>
      <Card elevated>
        <Text style={styles.text}>Elevated card</Text>
      </Card>
      <Heading>Status chips / badges</Heading>
      <View style={styles.wrap}>
        {tones.map((tone) => (
          <Chip key={tone} label={tone} tone={tone} />
        ))}
      </View>
      <Heading>Avatars</Heading>
      <View style={styles.wrap}>
        <Avatar name="Eco Nexus" />
        <Avatar name="" />
        <Avatar name="Image fallback" uri="invalid://avatar" />
        <Avatar name="EcoNexus logo" uri="https://reactnative.dev/img/tiny_logo.png" size={64} />
      </View>
      <Heading>Toasts</Heading>
      {tones.map((tone) => (
        <ToastExample key={tone} tone={tone} />
      ))}
      <Button title="Show timed notification" variant="secondary" onPress={() => setToast(true)} />
      <Toast message="Changes saved" tone="success" visible={toast} onDismiss={dismiss} />
      <Heading>Loaders</Heading>
      <Loader />
      <Loader label="Loading collections" size="large" />
      <Heading>Empty states</Heading>
      <EmptyState title="No collections yet" />
      <EmptyState
        title="No results"
        message="There are no collections matching your filters."
        icon="search-outline"
        action={{ label: 'Clear filters', onPress: () => setToast(true) }}
      />
    </ScreenContainer>
  );
}

function ToastExample({ tone }: { tone: StatusTone }) {
  const [visible, setVisible] = useState(true);
  return visible ? (
    <Toast
      message={`${tone} notification`}
      tone={tone}
      visible
      duration={0}
      onDismiss={() => setVisible(false)}
    />
  ) : (
    <Button title={`Show ${tone} notification`} variant="ghost" onPress={() => setVisible(true)} />
  );
}
const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.textPrimary },
  heading: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.xl },
  text: { ...typography.body, color: colors.textPrimary },
  group: { gap: spacing.sm, marginBottom: spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
