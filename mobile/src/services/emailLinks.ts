import { env } from '../config/env';
function tokenFromUrl(
  value: string | null,
  path: 'verify-email' | 'reset-password'
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const custom = url.protocol === 'econexus:' && url.hostname === path && !url.pathname;
    let owned = false;
    if (env.APP_LINK_BASE_URL) {
      const expected = new URL(path, `${env.APP_LINK_BASE_URL.replace(/\/$/, '')}/`);
      owned =
        url.protocol === 'https:' &&
        url.origin === expected.origin &&
        url.pathname === expected.pathname;
    }
    if ((!custom && !owned) || url.username || url.password) return null;
    const token = url.searchParams.get('token');
    return token && /^[a-fA-F0-9]{64}$/.test(token) ? token : null;
  } catch {
    return null;
  }
}
export const emailVerificationTokenFromUrl = (url: string | null) =>
  tokenFromUrl(url, 'verify-email');
export const passwordResetTokenFromUrl = (url: string | null) =>
  tokenFromUrl(url, 'reset-password');
