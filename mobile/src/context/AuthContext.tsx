import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import axios from 'axios';
import type { AuthUser, LoginInput, RegisterInput } from '../types/user';
import { authService } from '../services/auth.service';
import { tokenStorage, subscribeAccessToken } from '../services/tokenStorage';
import { registerForceLogoutHandler, logoutReasonForError } from '../services/api';
import type { ForceLogoutReason } from '../types/session';
import { userService } from '../services/user.service';
import { authenticateBiometric, canUseBiometrics } from '../services/biometric';

// ─────────────────────────────────────────────
// State & Action Types
// ─────────────────────────────────────────────

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';
export type { ForceLogoutReason } from '../types/session';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  logoutReason: ForceLogoutReason | null;
}

type AuthAction =
  | { type: 'DISMISS_REASON' }
  | { type: 'RESTORE_SESSION'; user: AuthUser }
  | { type: 'SIGN_IN'; user: AuthUser }
  | { type: 'SIGN_OUT'; reason?: ForceLogoutReason }
  | { type: 'TOKEN_CHANGED'; accessToken: string | null }
  | { type: 'UPDATE_USER'; user: Partial<AuthUser> }
  | { type: 'LOADING_DONE_NO_SESSION' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'DISMISS_REASON':
      return { ...state, logoutReason: null };
    case 'RESTORE_SESSION':
      return { ...state, status: 'signedIn', user: action.user, logoutReason: null };
    case 'SIGN_IN':
      return { ...state, status: 'signedIn', user: action.user, logoutReason: null };
    case 'SIGN_OUT':
      return {
        status: 'signedOut',
        user: null,
        accessToken: null,
        logoutReason: action.reason ?? null,
      };
    case 'LOADING_DONE_NO_SESSION':
      return { ...state, status: 'signedOut', user: null, accessToken: null };
    case 'TOKEN_CHANGED':
      return { ...state, accessToken: action.accessToken };
    case 'UPDATE_USER':
      return state.status === 'signedIn' && state.user
        ? { ...state, user: { ...state.user, ...action.user } }
        : state;
    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// Context Shape
// ─────────────────────────────────────────────

export interface AuthContextValue {
  dismissLogoutReason: () => void;
  accessToken: string | null;
  logoutReason: ForceLogoutReason | null;
  login: (input: LoginInput, keepSignedIn?: boolean) => Promise<void>;
  register: (input: RegisterInput, keepSignedIn?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: (reason: ForceLogoutReason) => Promise<void>;
  /** Current auth state: 'loading' | 'signedOut' | 'signedIn' */
  status: AuthStatus;
  /** Authenticated user profile, or null when signed out */
  user: AuthUser | null;
  /**
   * Sign in with email and password.
   * @param keepSignedIn - If false, refresh token is kept in memory only
   *   (session ends when the app is killed). Defaults to true.
   */
  signIn: (input: LoginInput, keepSignedIn?: boolean) => Promise<void>;
  /** Register a new account */
  signUp: (input: RegisterInput, keepSignedIn?: boolean) => Promise<void>;
  /** Sign out the current user and revoke tokens */
  signOut: () => Promise<void>;
  /** Sign in or register with Google OAuth ID token */
  signInWithGoogle: (idToken: string, keepSignedIn?: boolean, role?: string) => Promise<void>;
  loginWithGoogle?: (idToken: string, keepSignedIn?: boolean, role?: string) => Promise<void>;
  /** Reload the authenticated profile from the server. */
  refreshUser: () => Promise<void>;
  /** Update the local user profile state after a profile edit */
  updateUser: (updatedUser: Partial<AuthUser>) => void;
}

// ─────────────────────────────────────────────
// Create Context
// ─────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─────────────────────────────────────────────
// AuthProvider
// ─────────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [splashReady, setSplashReady] = React.useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSplashReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  const [state, dispatch] = useReducer(authReducer, {
    status: 'loading',
    user: null,
    accessToken: null,
    logoutReason: null,
  });

  const sessionVersion = useRef(0);
  useEffect(
    () =>
      subscribeAccessToken((accessToken) => {
        dispatch({ type: 'TOKEN_CHANGED', accessToken });
      }),
    []
  );

  const forceLogout = useCallback(async (reason: ForceLogoutReason): Promise<void> => {
    sessionVersion.current += 1;
    dispatch({ type: 'SIGN_OUT', reason });
    await tokenStorage.clearTokens();
  }, []);

  // Stable ref for user to avoid stale closure in updateUser
  const userRef = useRef<AuthUser | null>(null);
  useEffect(() => {
    userRef.current = state.user;
  }, [state.user]);

  // ─── Session Restoration on App Boot ───────
  useEffect(() => {
    const version = sessionVersion.current;
    let active = true;
    async function restoreSession(): Promise<void> {
      try {
        if (await tokenStorage.getBiometricEnabled()) {
          if (await canUseBiometrics()) {
            const unlocked = await authenticateBiometric('Unlock your EcoNexus session');
            if (!unlocked) {
              dispatch({ type: 'LOADING_DONE_NO_SESSION' });
              return;
            }
          } else {
            await tokenStorage.setBiometricEnabled(false);
            dispatch({ type: 'LOADING_DONE_NO_SESSION' });
            return;
          }
        }

        if (!active || version !== sessionVersion.current) return;

        // Memory-only sessions intentionally end when the app process exits.
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          dispatch({ type: 'LOADING_DONE_NO_SESSION' });
          return;
        }

        const tokens = await authService.refresh(refreshToken);
        if (!active || version !== sessionVersion.current) return;
        await tokenStorage.saveTokens(
          tokens.accessToken,
          tokens.refreshToken,
          await tokenStorage.getKeepSignedIn()
        );
        const user = await userService.getMe();
        if (active && version === sessionVersion.current)
          dispatch({ type: 'RESTORE_SESSION', user });
      } catch (error: unknown) {
        if (!active || version !== sessionVersion.current) return;
        const isTemporaryNetworkFailure = axios.isAxiosError(error) && !error.response;
        if (!isTemporaryNetworkFailure) await tokenStorage.clearTokens().catch(() => {});
        dispatch({
          type: 'SIGN_OUT',
          reason:
            axios.isAxiosError(error) &&
            (error.response?.status === 401 || error.response?.status === 403)
              ? logoutReasonForError(error)
              : undefined,
        });
      }
    }

    void restoreSession().catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // ─── Register Global Force-Logout Handler ──
  // The axios interceptor calls this when a 401 cannot be recovered
  // (e.g. refresh token is expired or revoked by the server).
  useEffect(() => {
    return registerForceLogoutHandler((reason) => {
      void forceLogout(reason).catch(() => {});
    });
  }, [forceLogout]);

  // ─── Sign In ────────────────────────────────
  const signIn = useCallback(async (input: LoginInput, keepSignedIn = true): Promise<void> => {
    const version = ++sessionVersion.current;
    const data = await authService.login(input);
    if (version !== sessionVersion.current) return;
    await tokenStorage.setKeepSignedIn(keepSignedIn);
    await tokenStorage.saveTokens(data.accessToken, data.refreshToken, keepSignedIn);
    if (version === sessionVersion.current) dispatch({ type: 'SIGN_IN', user: data.user });
  }, []);

  // ─── Sign Up ────────────────────────────────
  const signUp = useCallback(async (input: RegisterInput, keepSignedIn = true): Promise<void> => {
    const version = ++sessionVersion.current;
    const data = await authService.register(input);
    if (version !== sessionVersion.current) return;
    await tokenStorage.setKeepSignedIn(keepSignedIn);
    await tokenStorage.saveTokens(data.accessToken, data.refreshToken, keepSignedIn);
    if (version === sessionVersion.current) dispatch({ type: 'SIGN_IN', user: data.user });
  }, []);

  // ─── Sign In with Google ────────────────────
  const signInWithGoogle = useCallback(
    async (idToken: string, keepSignedIn = true, role?: string): Promise<void> => {
      const version = ++sessionVersion.current;
      const data = await authService.loginWithGoogle(idToken, role);
      if (version !== sessionVersion.current) return;
      await tokenStorage.setKeepSignedIn(keepSignedIn);
      await tokenStorage.saveTokens(data.accessToken, data.refreshToken, keepSignedIn);
      if (version === sessionVersion.current) dispatch({ type: 'SIGN_IN', user: data.user });
    },
    []
  );

  // ─── Sign Out ───────────────────────────────
  const signOut = useCallback(async (): Promise<void> => {
    sessionVersion.current += 1;
    dispatch({ type: 'SIGN_OUT' });
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        // Best-effort: tell the server to revoke this token family
        await authService.logout(refreshToken).catch(() => {});
      }
    } finally {
      try {
        await tokenStorage.clearTokens();
      } finally {
        dispatch({ type: 'SIGN_OUT' });
      }
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!userRef.current) return;
    const version = sessionVersion.current;
    const user = await userService.getMe();
    if (version === sessionVersion.current) dispatch({ type: 'RESTORE_SESSION', user });
  }, []);

  // ─── Update Local User Profile ──────────────
  // Used after PATCH /users/me to keep the context in sync without a full reload
  const updateUser = useCallback((updatedUser: Partial<AuthUser>): void => {
    dispatch({ type: 'UPDATE_USER', user: updatedUser });
  }, []);

  const value: AuthContextValue = {
    status: splashReady ? state.status : 'loading',
    user: state.user,
    accessToken: state.status === 'signedIn' ? state.accessToken : null,
    logoutReason: state.logoutReason,
    dismissLogoutReason: useCallback(() => dispatch({ type: 'DISMISS_REASON' }), []),
    login: signIn,
    register: signUp,
    logout: signOut,
    forceLogout,
    signIn,
    signUp,
    signInWithGoogle,
    loginWithGoogle: signInWithGoogle,
    signOut,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────
// useAuth Hook
// ─────────────────────────────────────────────

/**
 * Consume the AuthContext. Must be used inside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}

export default AuthContext;
