import type { AuthStatus } from '../context/AuthContext';
import type { AuthUser } from '../types/user';

export type RootFlow =
  | 'loading'
  | 'onboarding-loading'
  | 'onboarding'
  | 'signed-out'
  | 'email-verification'
  | 'pending-verification'
  | 'rejected'
  | 'suspended'
  | 'role';

export function getRootFlow(
  status: AuthStatus,
  user: AuthUser | null,
  onboardingSeen: boolean | null
): RootFlow {
  if (status === 'loading') return 'loading';
  if (status === 'signedOut' || !user) {
    if (onboardingSeen === null) return 'onboarding-loading';
    return onboardingSeen ? 'signed-out' : 'onboarding';
  }

  if (user.status !== 'SUSPENDED' && user.status !== 'REJECTED' && user.emailVerified !== true)
    return 'email-verification';
  switch (user.status) {
    case 'PENDING_VERIFICATION':
      return 'pending-verification';
    case 'REJECTED':
      return 'rejected';
    case 'SUSPENDED':
      return 'suspended';
    case 'ACTIVE':
      return 'role';
  }
}
