// Reuse the existing implementation so old and new callers share one contract.
import { authService } from '../services/auth.service';

export const authApi = authService;
export type { LoginInput, RegisterInput, AuthResponse, RefreshTokenResponse } from '../types/user';
