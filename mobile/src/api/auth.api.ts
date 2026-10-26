// Reuse the existing implementation so old and new callers share one contract.
export { authService as authApi } from '../services/auth.service';
export type { LoginInput, RegisterInput, AuthResponse, RefreshTokenResponse } from '../types/user';
