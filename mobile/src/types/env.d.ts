declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_SOCKET_URL?: string;
    EXPO_PUBLIC_ENV?: string;
    [key: string]: string | undefined;
  };
};