import { describe, expect, it } from '@jest/globals';
import { readMobileEnvironment } from '../config/environment';

describe('mobile release configuration', () => {
  const settings = {
    environment: 'production',
    apiUrl: 'https://api.econexus.test/api',
    socketUrl: 'https://api.econexus.test',
  };
  it('requires an explicit release environment', () => {
    expect(() => readMobileEnvironment({}, false, 'android')).toThrow('EXPO_PUBLIC_ENV');
  });
  it('cannot select development for a release bundle', () => {
    expect(() =>
      readMobileEnvironment({ ...settings, environment: 'development' }, false, 'android')
    ).toThrow('development');
  });
  it('rejects misspelled environments', () => {
    expect(() => readMobileEnvironment({ ...settings, environment: 'prod' }, false, 'web')).toThrow(
      'EXPO_PUBLIC_ENV'
    );
  });
  it.each(['apiUrl', 'socketUrl'])('requires explicit %s', (key) => {
    expect(() => readMobileEnvironment({ ...settings, [key]: '' }, false, 'android')).toThrow(
      'HTTPS'
    );
  });
  it.each([
    'http://api.econexus.test',
    'https://localhost',
    'https://127.0.0.1',
    'https://10.0.2.2',
    'https://user:password@api.econexus.test',
  ])('rejects unsafe release URL %s', (apiUrl) => {
    expect(() => readMobileEnvironment({ ...settings, apiUrl }, false, 'android')).toThrow('HTTPS');
  });
  it.each(['staging', 'production'])('accepts an explicit HTTPS %s build', (environment) => {
    expect(readMobileEnvironment({ ...settings, environment }, false, 'android').IS_DEV).toBe(
      false
    );
  });
  it('keeps emulator defaults only for genuine development builds', () => {
    expect(readMobileEnvironment({}, true, 'android').API_URL).toBe('http://10.0.2.2:4000/api');
  });
  it('applies release URL rules to a staging development client too', () => {
    expect(() => readMobileEnvironment({ environment: 'staging' }, true, 'android')).toThrow(
      'HTTPS'
    );
  });
});
