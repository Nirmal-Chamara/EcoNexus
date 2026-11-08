import React from 'react';
import { jest, test, expect } from '@jest/globals';
import { fireEvent, render, act } from '@testing-library/react-native';
import { PasswordInput, Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Checkbox';
import { Toast } from '../components/ui/Feedback';
import { Button } from '../components/common/Button';

jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');

test('password is hidden by default and reveal toggles both ways', () => {
  const screen = render(React.createElement(PasswordInput, { label: 'Password' }));
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
  fireEvent.press(screen.getByLabelText('Show password'));
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
  fireEvent.press(screen.getByLabelText('Hide password'));
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
});

test('input preserves consumer focus and blur handlers', () => {
  const onFocus = jest.fn();
  const onBlur = jest.fn();
  const screen = render(React.createElement(Input, { label: 'Email', onFocus, onBlur }));
  fireEvent(screen.getByLabelText('Email'), 'focus', {});
  fireEvent(screen.getByLabelText('Email'), 'blur', {});
  expect(onFocus).toHaveBeenCalledTimes(1);
  expect(onBlur).toHaveBeenCalledTimes(1);
});

test('loading and disabled buttons block submissions', () => {
  const onPress = jest.fn();
  const screen = render(React.createElement(Button, { title: 'Save', loading: true, onPress }));
  fireEvent.press(screen.getByLabelText('Save'));
  screen.rerender(React.createElement(Button, { title: 'Save', disabled: true, onPress }));
  fireEvent.press(screen.getByLabelText('Save'));
  expect(onPress).not.toHaveBeenCalled();
});

test('checkbox emits next value but does not change when disabled', () => {
  const onChange = jest.fn();
  const screen = render(
    React.createElement(Checkbox, { label: 'Remember', checked: false, onChange })
  );
  fireEvent.press(screen.getByRole('checkbox'));
  expect(onChange).toHaveBeenCalledWith(true);
  screen.rerender(
    React.createElement(Checkbox, { label: 'Remember', checked: true, disabled: true, onChange })
  );
  fireEvent.press(screen.getByRole('checkbox'));
  expect(onChange).toHaveBeenCalledTimes(1);
});

test('toast auto-dismisses and cancels pending dismissal on unmount', () => {
  jest.useFakeTimers();
  const onDismiss = jest.fn();
  const screen = render(
    React.createElement(Toast, { message: 'Saved', visible: true, onDismiss, duration: 1000 })
  );
  act(() => jest.advanceTimersByTime(1000));
  expect(onDismiss).toHaveBeenCalledTimes(1);
  screen.rerender(
    React.createElement(Toast, { message: 'Updated', visible: true, onDismiss, duration: 1000 })
  );
  screen.unmount();
  act(() => jest.advanceTimersByTime(1000));
  expect(onDismiss).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});
