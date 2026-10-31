import React from 'react';
import UserNavigator from './UserNavigator';
import CollectorNavigator from './CollectorNavigator';
import RecyclingCenterNavigator from './RecyclingCenterNavigator';
import AdminNavigator from './AdminNavigator';
import { useAuth } from '../context/AuthContext';

export default function RoleNavigator() {
  const { user } = useAuth();
  if (!user || user.status !== 'ACTIVE') return null;

  switch (user.role) {
    case 'USER':
      return <UserNavigator />;
    case 'COLLECTOR':
      return <CollectorNavigator />;
    case 'RECYCLING_CENTER':
      return <RecyclingCenterNavigator />;
    case 'ADMIN':
      return <AdminNavigator />;
  }
}
