interface MobileSettings {
  environment?: string;
  apiUrl?: string;
  socketUrl?: string;
}

export function readMobileEnvironment(
  settings: MobileSettings,
  developmentBuild: boolean,
  platform: string
) {
  const environment = settings.environment || (developmentBuild ? 'development' : '');
  if (!['development', 'staging', 'production'].includes(environment))
    throw new Error(
      'EXPO_PUBLIC_ENV must explicitly identify staging or production for release builds'
    );
  if (!developmentBuild && environment === 'development')
    throw new Error('Release builds cannot use the development environment');
  const development = environment === 'development' && developmentBuild;
  const host = platform === 'android' ? '10.0.2.2' : 'localhost';
  const apiUrl = settings.apiUrl || (development ? `http://${host}:4000/api` : '');
  const socketUrl = settings.socketUrl || (development ? `http://${host}:4000` : '');
  for (const [key, value] of [
    ['EXPO_PUBLIC_API_URL', apiUrl],
    ['EXPO_PUBLIC_SOCKET_URL', socketUrl],
  ]) {
    try {
      const url = new URL(value);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      )
        throw new Error();
      if (
        !development &&
        (url.protocol !== 'https:' ||
          ['localhost', '127.0.0.1', '[::1]', '10.0.2.2'].includes(url.hostname))
      )
        throw new Error();
    } catch {
      throw new Error(
        `${key} must explicitly use a valid HTTPS deployment URL outside development`
      );
    }
  }
  return { API_URL: apiUrl, SOCKET_URL: socketUrl, ENV: environment, IS_DEV: development };
}
