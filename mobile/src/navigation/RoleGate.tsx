import React from 'react';
import type { ReactNode } from 'react';
import type { AccountStatus, UserRole } from '../types/user';
import { useAuth } from '../context/AuthContext';

interface RoleGateProps {
  allow: UserRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function useHasRole(role: UserRole | UserRole[]): boolean {
  const { user } = useAuth();
  const allowedRoles = Array.isArray(role) ? role : [role];
  return user !== null && allowedRoles.includes(user.role);
}

export function useHasAccountStatus(status: AccountStatus | AccountStatus[]): boolean {
  const { user } = useAuth();
  const allowedStatuses = Array.isArray(status) ? status : [status];
  return user !== null && allowedStatuses.includes(user.status);
}

export default function RoleGate({ allow, fallback = null, children }: RoleGateProps) {
  return useHasRole(allow) ? <>{children}</> : <>{fallback}</>;
}
