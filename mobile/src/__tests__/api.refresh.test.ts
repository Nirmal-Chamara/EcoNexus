import { describe, expect, it, jest } from '@jest/globals';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosAdapter, AxiosResponse } from 'axios';
import { apiClient } from '../services/api';
import { tokenStorage } from '../services/tokenStorage';

jest.mock('../services/tokenStorage', () => ({
  tokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    getKeepSignedIn: jest.fn(),
    saveTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

describe('API token refresh', () => {
  it('shares one refresh request across concurrent unauthorized requests', async () => {
    let accessToken = 'expired-access-token';
    const storage = jest.mocked(tokenStorage);
    storage.getAccessToken.mockImplementation(async () => accessToken);
    storage.getRefreshToken.mockResolvedValue('refresh-token');
    storage.getKeepSignedIn.mockResolvedValue(true);
    storage.saveTokens.mockImplementation(async (newAccessToken) => {
      accessToken = newAccessToken;
    });

    const refreshResponse: AxiosResponse = {
      data: {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'rotated-refresh-token',
        },
      },
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders(),
        url: '/auth/refresh-token',
        method: 'post',
      },
    };
    const refreshSpy = jest.spyOn(axios, 'post').mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return refreshResponse;
    });

    const adapter: AxiosAdapter = async (config) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      const response = {
        data: {},
        statusText: 'OK',
        headers: new AxiosHeaders(),
        config,
      };

      if (config.headers.get('Authorization') === 'Bearer new-access-token') {
        return { ...response, status: 200 };
      }

      const unauthorized = { ...response, status: 401 };
      throw new AxiosError(
        'Unauthorized',
        AxiosError.ERR_BAD_REQUEST,
        config,
        undefined,
        unauthorized
      );
    };

    apiClient.defaults.adapter = adapter;
    try {
      const responses = await Promise.all([
        apiClient.get('/resource/1'),
        apiClient.get('/resource/2'),
        apiClient.get('/resource/3'),
      ]);

      expect(responses).toHaveLength(3);
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(storage.saveTokens).toHaveBeenCalledWith(
        'new-access-token',
        'rotated-refresh-token',
        true
      );
    } finally {
      refreshSpy.mockRestore();
      delete apiClient.defaults.adapter;
    }
  });
});
