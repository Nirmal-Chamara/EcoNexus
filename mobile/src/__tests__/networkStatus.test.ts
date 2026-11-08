import React from 'react';
import { act, render } from '@testing-library/react-native';
import { beforeEach, expect, jest, test } from '@jest/globals';
import NetworkStatusBanner from '../components/common/NetworkStatusBanner';
import { resetNetworkStatusForTests, setNetworkOffline } from '../services/networkStatus';

beforeEach(() => {
  jest.clearAllMocks();
  resetNetworkStatusForTests();
});

test('offline banner appears when the API reports a network failure and clears on reconnect', () => {
  const screen = render(React.createElement(NetworkStatusBanner));
  expect(screen.queryByRole('alert')).toBeNull();

  act(() => setNetworkOffline(true));
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText('You’re offline')).toBeTruthy();

  act(() => setNetworkOffline(false));
  expect(screen.queryByRole('alert')).toBeNull();
});
