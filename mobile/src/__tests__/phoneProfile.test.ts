import React from 'react';
import { jest, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import EditProfileScreen from '../screens/shared/EditProfileScreen';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/user.service';
import { normalizePhone } from '../utils/phone';
import { registerSchema } from '../schemas/auth.schema';

const mockNavigation = { goBack: jest.fn(), addListener: jest.fn(() => jest.fn()), dispatch: jest.fn() };
jest.mock('@react-navigation/native', () => ({ useNavigation: () => mockNavigation }));
jest.mock('../hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('../services/user.service', () => ({ userService: { updateMe: jest.fn() } }));
const updateUser = jest.fn();
const user = { name: 'Person', phone: '+94771234567', email: 'person@example.com' };
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.mocked(useAuth).mockReturnValue({ user, updateUser } as never);
  jest.mocked(userService.updateMe).mockResolvedValue({ ...user, phone: null } as never);
});
afterEach(() => { jest.restoreAllMocks(); });

it.each([
  ['+94 77 123 4567', '+94771234567'],
  [' +94 (71) 123-4567 ', '+94711234567'],
  ['+1 (213) 373-4253', '+12133734253'],
])('normalizes %s consistently at mobile enrollment', (phone, expected) => {
  expect(normalizePhone(phone)).toBe(expected);
  expect(registerSchema.parse({ name: 'Person', email: user.email, password: 'Password1', role: 'USER', phone }).phone).toBe(expected);
});
it.each(['0771234567', '94771234567', '0094771234567', '+9991234567', '+94771234567 ext 9', 'Call +94771234567', '+94 ７７1234567'])('rejects ambiguous/invalid destination %s', (phone) => {
  expect(normalizePhone(phone)).toBeNull();
});
it('sends an explicit null when clearing the phone and trusts the server response', async () => {
  const screen = render(React.createElement(EditProfileScreen));
  fireEvent.changeText(screen.getByTestId('edit-profile-phone-input'), '');
  await act(async () => { fireEvent.press(screen.getByTestId('edit-profile-save-btn')); });
  await waitFor(() => expect(userService.updateMe).toHaveBeenCalledWith({ phone: null }));
  expect(updateUser).toHaveBeenCalledWith({ name: 'Person', phone: null });
}, 15000);
it('preserves displayed account state if saving the proposed phone fails', async () => {
  jest.mocked(userService.updateMe).mockRejectedValueOnce(new Error('Unavailable'));
  const screen = render(React.createElement(EditProfileScreen));
  fireEvent.changeText(screen.getByTestId('edit-profile-phone-input'), '+94 71 123 4567');
  await act(async () => { fireEvent.press(screen.getByTestId('edit-profile-save-btn')); });
  await waitFor(() => expect(userService.updateMe).toHaveBeenCalledWith({ phone: '+94711234567' }));
  expect(updateUser).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
});
it('allows a name correction without rewriting an ambiguous legacy phone', async () => {
  jest.mocked(useAuth).mockReturnValue({ user: { ...user, phone: '0771234567' }, updateUser } as never);
  jest.mocked(userService.updateMe).mockResolvedValueOnce({ ...user, name: 'Correct Name', phone: '0771234567' } as never);
  const screen = render(React.createElement(EditProfileScreen));
  fireEvent.changeText(screen.getByTestId('edit-profile-name-input'), ' Correct Name ');
  await act(async () => { fireEvent.press(screen.getByTestId('edit-profile-save-btn')); });
  await waitFor(() => expect(userService.updateMe).toHaveBeenCalledWith({ name: 'Correct Name' }));
});
it('blocks invalid new numbers without sending a request', async () => {
  const screen = render(React.createElement(EditProfileScreen));
  fireEvent.changeText(screen.getByTestId('edit-profile-phone-input'), '0771234567');
  await act(async () => { fireEvent.press(screen.getByTestId('edit-profile-save-btn')); });
  await screen.findByText('Use a valid international number, for example +94 77 123 4567');
  expect(userService.updateMe).not.toHaveBeenCalled();
});
