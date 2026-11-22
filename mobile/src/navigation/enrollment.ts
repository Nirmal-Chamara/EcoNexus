import type { PublicEnrollmentRole } from '../types/user';

export type EnrollmentRole = 'user' | 'collector' | 'center';
export function isEnrollmentRole(value: unknown): value is EnrollmentRole {
  return value === 'user' || value === 'collector' || value === 'center';
}
export function enrollmentParams(role: EnrollmentRole) {
  return { role, partner: role !== 'user' };
}
export function enrollmentAccountRole(
  role?: EnrollmentRole,
  partner = false
): PublicEnrollmentRole {
  return role === 'center'
    ? 'RECYCLING_CENTER'
    : role === 'collector' || partner
      ? 'COLLECTOR'
      : 'USER';
}
