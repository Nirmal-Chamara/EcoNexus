import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { colors } from '../theme';
import { Button } from '../components/common/Button';
import { PasswordInput } from '../components/ui/Input';
import { statusColors, Loader } from '../components/ui/Feedback';

jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');

// WCAG relative luminance for opaque sRGB token pairs.
function luminance(hex: string) {
  const rgb = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

const pairs: [string, string, string][] = [];
for (const background of [colors.background, colors.surface, colors.surfaceAlt]) {
  for (const foreground of [
    colors.textPrimary,
    colors.textSecondary,
    colors.textMuted,
    colors.primary,
    colors.error,
  ]) {
    pairs.push(['dark surface text', foreground, background]);
  }
}
for (const foreground of Object.values(statusColors)) {
  pairs.push(['status chip', foreground, colors.surface]);
}
pairs.push(
  ['primary button', colors.textInverse, colors.primary],
  ['danger button', colors.textInverse, colors.error],
  ['avatar initials', colors.textInverse, colors.primaryMuted]
);

test.each(pairs)('%s %s on %s meets 4.5:1', (_name, foreground, background) => {
  expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
});

test('button keeps its busy semantics and minimum target with custom accessibility props', () => {
  const screen = render(
    React.createElement(Button, {
      title: 'Save',
      loading: true,
      accessibilityLabel: 'Save profile',
      accessibilityState: { busy: false },
    })
  );
  const button = screen.getByRole('button');
  expect(button.props.accessibilityLabel).toBe('Save profile');
  expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  const style = StyleSheet.flatten(button.props.style);
  expect(style.minWidth).toBeGreaterThanOrEqual(44);
  expect(style.minHeight).toBeGreaterThanOrEqual(44);
  expect(style.height).toBeUndefined();
});

test('password toggle has a label and 44pt target; field exposes disabled state', () => {
  const screen = render(React.createElement(PasswordInput, { label: 'Password', editable: false }));
  const toggle = screen.getByRole('button', { name: 'Show password' });
  const style = StyleSheet.flatten(toggle.props.style);
  expect(style.width).toBeGreaterThanOrEqual(44);
  expect(style.minHeight).toBeGreaterThanOrEqual(44);
  expect(screen.getByLabelText('Password').props.accessibilityState.disabled).toBe(true);
});

test('loader exposes a named busy progress indicator', () => {
  const screen = render(React.createElement(Loader, { label: 'Loading collections' }));
  expect(
    screen.getByRole('progressbar', { name: 'Loading collections' }).props.accessibilityState.busy
  ).toBe(true);
});
