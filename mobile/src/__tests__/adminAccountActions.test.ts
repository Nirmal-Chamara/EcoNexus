import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import UserDetailScreen from '../screens/admin/UserDetailScreen';
import { adminService } from '../services/admin.service';
import type { AdminUserDetail } from '../services/admin.service';

const mockUser: AdminUserDetail = {
  id: 'target-id',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  role: 'USER',
  status: 'SUSPENDED',
  created_at: '2026-11-16',
  updated_at: '2026-11-16',
  activity: [],
};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => ({ params: { user: mockUser } }),
}));
jest.mock('../services/admin.service', () => ({
  adminService: { getUser: jest.fn(), updateUserStatus: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUser.status = 'SUSPENDED';
  mockUser.role = 'USER';
  jest.mocked(adminService.getUser).mockResolvedValue({ message: 'Loaded', data: { ...mockUser } });
  jest
    .mocked(adminService.updateUserStatus)
    .mockResolvedValue({ message: 'Restored', data: { ...mockUser, status: 'ACTIVE' } });
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find((button) => button.text === 'Confirm')?.onPress?.();
  });
});
afterEach(() => { jest.restoreAllMocks(); });

test('restoration requires a reason and sends it with the server request', async () => {
  const screen = render(React.createElement(UserDetailScreen));
  await waitFor(() => expect(adminService.getUser).toHaveBeenCalled());
  fireEvent.press(screen.getByTestId('action-activate'));
  fireEvent.press(screen.getByTestId('action-confirm-status-change'));
  expect(adminService.updateUserStatus).not.toHaveBeenCalled();
  fireEvent.changeText(
    screen.getByLabelText('Reason for account status change'),
    'Review completed'
  );
  await act(async () => {
    fireEvent.press(screen.getByTestId('action-confirm-status-change'));
  });
  await waitFor(() =>
    expect(adminService.updateUserStatus).toHaveBeenCalledWith(
      'target-id',
      'ACTIVE',
      'Review completed'
    )
  );
  expect(screen.getByText('Active')).toBeTruthy();
}, 15000);

test('pending partners cannot use direct activation or generic rejection', async () => {
  mockUser.role = 'COLLECTOR';
  mockUser.status = 'PENDING_VERIFICATION';
  jest.mocked(adminService.getUser).mockResolvedValue({ message: 'Loaded', data: { ...mockUser } });
  const screen = render(React.createElement(UserDetailScreen));
  await waitFor(() => expect(adminService.getUser).toHaveBeenCalled());
  fireEvent.press(screen.getByTestId('action-activate'));
  expect(screen.queryByLabelText('Reason for account status change')).toBeNull();
  expect(screen.queryByTestId('action-reject')).toBeNull();
  expect(adminService.updateUserStatus).not.toHaveBeenCalled();
});

test('a denied restoration keeps the suspended state and shows the policy error', async () => {
  jest
    .mocked(adminService.updateUserStatus)
    .mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { code: 'PARTNER_REVIEW_REQUIRED' } },
    });
  const screen = render(React.createElement(UserDetailScreen));
  await waitFor(() => expect(adminService.getUser).toHaveBeenCalled());
  fireEvent.press(screen.getByTestId('action-activate'));
  fireEvent.changeText(
    screen.getByLabelText('Reason for account status change'),
    'Review requested'
  );
  await act(async () => {
    fireEvent.press(screen.getByTestId('action-confirm-status-change'));
  });
  expect(await screen.findByText(/needs a valid reviewed application/)).toBeTruthy();
  expect(screen.getByText('Suspended')).toBeTruthy();
  expect(screen.queryByText('Active')).toBeNull();
});
