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
import { tokenStorage } from '../services/tokenStorage';
import { registerForceLogoutHandler } from '../services/api';
import { userService } from '../services/user.service';
import { authenticateBiometric, canUseBiometrics } from '../services/biometric';

// ─────────────────────────────────────────────
// State & Action Types
// ─────────────────────────────────────────────

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

type AuthAction =
  | { type: 'RESTORE_SESSION'; user: AuthUser }
  | { type: 'SIGN_IN'; user: AuthUser }
  | { type: 'SIGN_OUT' }
  | { type: 'LOADING_DONE_NO_SESSION' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_SESSION':
      return { status: 'signedIn', user: action.user };
    case 'SIGN_IN':
      return { status: 'signedIn', user: action.user };
    case 'SIGN_OUT':
      return { status: 'signedOut', user: null };
    case 'LOADING_DONE_NO_SESSION':
      return { status: 'signedOut', user: null };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// Context Shape
// ─────────────────────────────────────────────

interface AuthContextValue {
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
  const [state, dispatch] = useReducer(authReducer, {
    status: 'loading',
    user: null,
  });

  // Stable ref for user to avoid stale closure in updateUser
  const userRef = useRef<AuthUser | null>(null);
  useEffect(() => {
    userRef.current = state.user;
  }, [state.user]);

  // ─── Session Restoration on App Boot ───────
  useEffect(() => {
    async function restoreSession(): Promise<void> {
      try {
        const refreshToken = await tokenStorage.getRefreshToken();

        // Memory-only sessions intentionally end when the app process exits.
        if (!refreshToken) {
          dispatch({ type: 'LOADING_DONE_NO_SESSION' });
          return;
        }

        if (await tokenStorage.getBiometricEnabled()) {
          if (await canUseBiometrics()) {
            const unlocked = await authenticateBiometric('Unlock your EcoNexus session');
            if (!unlocked) {
              dispatch({ type: 'LOADING_DONE_NO_SESSION' });
              return;
            }
          } else {
            await tokenStorage.setBiometricEnabled(false);
          }
        }

        const tokens = await authService.refresh(refreshToken);
        await tokenStorage.saveTokens(
          tokens.accessToken,
          tokens.refreshToken,
          await tokenStorage.getKeepSignedIn()
        );
        const user = await userService.getMe();
        dispatch({ type: 'RESTORE_SESSION', user });
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          await tokenStorage.clearTokens();
        }
        dispatch({ type: 'LOADING_DONE_NO_SESSION' });
      }
    }

    restoreSession();
  }, []);

  // ─── Register Global Force-Logout Handler ──
  // The axios interceptor calls this when a 401 cannot be recovered
  // (e.g. refresh token is expired or revoked by the server).
  useEffect(() => {
    registerForceLogoutHandler(async () => {
      await tokenStorage.clearTokens();
      dispatch({ type: 'SIGN_OUT' });
    });
  }, []);

  // ─── Sign In ────────────────────────────────
  const signIn = useCallback(async (input: LoginInput, keepSignedIn = true): Promise<void> => {
    const data = await authService.login(input);
    await tokenStorage.setKeepSignedIn(keepSignedIn);
    await tokenStorage.saveTokens(data.accessToken, data.refreshToken, keepSignedIn);
    dispatch({ type: 'SIGN_IN', user: data.user });
  }, []);

  // ─── Sign Up ────────────────────────────────
  const signUp = useCallback(async (input: RegisterInput, keepSignedIn = true): Promise<void> => {
    const data = await authService.register(input);
    await tokenStorage.setKeepSignedIn(keepSignedIn);
    await tokenStorage.saveTokens(data.accessToken, data.refreshToken, keepSignedIn);
    dispatch({ type: 'SIGN_IN', user: data.user });
  }, []);

  // ─── Sign Out ───────────────────────────────
  const signOut = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        // Best-effort: tell the server to revoke this token family
        await authService.logout(refreshToken).catch(() => {});
      }
    } finally {
      await tokenStorage.clearTokens();
      dispatch({ type: 'SIGN_OUT' });
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    const user = await userService.getMe();
    dispatch({ type: 'RESTORE_SESSION', user });
  }, []);

  // ─── Update Local User Profile ──────────────
  // Used after PATCH /users/me to keep the context in sync without a full reload
  const updateUser = useCallback((updatedUser: Partial<AuthUser>): void => {
    if (!userRef.current) return;
    dispatch({
      type: 'SIGN_IN',
      user: { ...userRef.current, ...updatedUser },
    });
  }, []);

  const value: AuthContextValue = {
    status: state.status,
    user: state.user,
    signIn,
    signUp,
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
