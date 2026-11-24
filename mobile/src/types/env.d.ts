declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_SOCKET_URL?: string;
    EXPO_PUBLIC_ENV?: string;
    [key: string]: string | undefined;
  };
};

declare module 'expo-web-browser' {
  export function maybeCompleteAuthSession(): any;
  export function openAuthSessionAsync(...args: any[]): Promise<any>;
}

declare module 'expo-auth-session' {
  export interface DiscoveryDocument {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    revocationEndpoint: string;
    userInfoEndpoint: string;
  }
  export enum ResponseType {
    Token = 'token',
    Code = 'code',
    IdToken = 'id_token',
  }
  export function makeRedirectUri(options?: any): string;
  export function loadAsync(config: any, discovery: DiscoveryDocument): Promise<any>;
}

declare module 'expo-crypto' {
  export function randomUUID(): string;
  export function digestStringAsync(...args: any[]): Promise<string>;
}

declare module '@expo-google-fonts/poppins' {
  export const Poppins_500Medium: number;
  export const Poppins_600SemiBold: number;
  export const Poppins_700Bold: number;
}

declare module '@expo-google-fonts/inter' {
  export const Inter_400Regular: number;
  export const Inter_500Medium: number;
  export const Inter_600SemiBold: number;
}
