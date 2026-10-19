// RoleGate.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import UserNavigator from './UserNavigator';
import CollectorNavigator from './CollectorNavigator';
import RecyclingCenterNavigator from './RecyclingCenterNavigator';
import AdminNavigator from './AdminNavigator';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * RoleGate – decides which navigation flow to render based on authentication state
 * and the user's role.
 */
export default function RoleGate() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    // While restoring session or checking auth status, show a spinner.
    return <LoadingSpinner />;
  }

  if (status === 'signedOut' || !user) {
    // No active session – route to authentication flow.
    return <AuthNavigator />;
  }

  // User is signed in – render the appropriate role‑based tab navigator.
  switch (user.role) {
    case 'USER':
      return <UserNavigator />;
    case 'COLLECTOR':
      return <CollectorNavigator />;
    case 'RECYCLING_CENTER':
      return <RecyclingCenterNavigator />;
    case 'ADMIN':
      return <AdminNavigator />;
    default:
      // Fallback – should never happen, but render auth flow for safety.
      return <AuthNavigator />;
  }
}
