import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { AuthUser, LoginInput, RegisterInput } from '../types/user';
import { authService } from '../services/auth.service';
import { tokenStorage } from '../services/tokenStorage';
import { registerForceLogoutHandler } from '../services/api';

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
  /** Sign in with email and password */
  signIn: (input: LoginInput) => Promise<void>;
  /** Register a new account */
  signUp: (input: RegisterInput) => Promise<void>;
  /** Sign out the current user and revoke tokens */
  signOut: () => Promise<void>;
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
  userRef.current = state.user;

  // ─── Session Restoration on App Boot ───────
  useEffect(() => {
    async function restoreSession(): Promise<void> {
      try {
        const accessToken = await tokenStorage.getAccessToken();
        const refreshToken = await tokenStorage.getRefreshToken();

        if (!accessToken || !refreshToken) {
          dispatch({ type: 'LOADING_DONE_NO_SESSION' });
          return;
        }

        // Attempt to fetch the current user profile using stored access token
        const { apiClient } = await import('../services/api');
        const response = await apiClient.get<{ user: AuthUser }>('/users/me');
        dispatch({ type: 'RESTORE_SESSION', user: response.data.user });
      } catch {
        // Token is invalid or expired; the axios interceptor handles refresh.
        // If it reaches here, all refresh attempts also failed.
        await tokenStorage.clearTokens();
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
  const signIn = useCallback(async (input: LoginInput): Promise<void> => {
    const data = await authService.login(input);
    await tokenStorage.saveTokens(data.accessToken, data.refreshToken);
    dispatch({ type: 'SIGN_IN', user: data.user });
  }, []);

  // ─── Sign Up ────────────────────────────────
  const signUp = useCallback(async (input: RegisterInput): Promise<void> => {
    const data = await authService.register(input);
    await tokenStorage.saveTokens(data.accessToken, data.refreshToken);
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
