import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { getRootFlow } from '../navigation/rootFlow';
import RoleGate, { useHasAccountStatus, useHasRole } from '../navigation/RoleGate';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);

const user = {
  id: 'user-id',
  name: 'Alex Green',
  email: 'alex@example.com',
  role: 'USER' as const,
  status: 'ACTIVE' as const,
};

test('root flow maps auth and account states to the correct navigation tree', () => {
  expect(getRootFlow('loading', null, null)).toBe('loading');
  expect(getRootFlow('signedOut', null, null)).toBe('onboarding-loading');
  expect(getRootFlow('signedOut', null, false)).toBe('onboarding');
  expect(getRootFlow('signedOut', null, true)).toBe('signed-out');
  expect(getRootFlow('signedIn', { ...user, status: 'PENDING_VERIFICATION' }, true)).toBe(
    'pending-verification'
  );
  expect(getRootFlow('signedIn', { ...user, status: 'REJECTED' }, true)).toBe('rejected');
  expect(getRootFlow('signedIn', { ...user, status: 'SUSPENDED' }, true)).toBe('suspended');
  expect(getRootFlow('signedIn', user, true)).toBe('role');
});

test('RoleGate only renders cosmetic controls for allowed roles', () => {
  mockedUseAuth.mockReturnValue({ user } as never);
  const household = render(
    React.createElement(
      RoleGate,
      { allow: ['ADMIN'], fallback: React.createElement(Text, null, 'Hidden') },
      React.createElement(Text, null, 'Admin tools')
    )
  );
  expect(household.getByText('Hidden')).toBeTruthy();
  expect(household.queryByText('Admin tools')).toBeNull();

  mockedUseAuth.mockReturnValue({ user: { ...user, role: 'ADMIN' } } as never);
  household.rerender(
    React.createElement(
      RoleGate,
      { allow: ['ADMIN'], fallback: React.createElement(Text, null, 'Hidden') },
      React.createElement(Text, null, 'Admin tools')
    )
  );
  expect(household.getByText('Admin tools')).toBeTruthy();
  expect(household.queryByText('Hidden')).toBeNull();
});

test('role and account-status helpers support single values and arrays', () => {
  mockedUseAuth.mockReturnValue({ user } as never);

  function HelperProbe() {
    return React.createElement(
      Text,
      null,
      `${useHasRole(['USER', 'ADMIN'])}-${useHasAccountStatus(['ACTIVE', 'SUSPENDED'])}`
    );
  }

  const screen = render(React.createElement(HelperProbe));
  expect(screen.getByText('true-true')).toBeTruthy();
});
