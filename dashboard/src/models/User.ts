import { timestamp } from '../config/firebase';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user' | 'viewer';
  isActive: boolean;
  settings?: {
    notifications: boolean;
    theme: 'light' | 'dark';
    timezone: string;
  };
  metadata: {
    createdAt: FirebaseFirestore.Timestamp | ReturnType<typeof timestamp>;
    updatedAt: FirebaseFirestore.Timestamp | ReturnType<typeof timestamp>;
    lastLoginAt?: FirebaseFirestore.Timestamp;
  };
}

export const createUser = (data: Omit<User, 'id' | 'metadata'>): Omit<User, 'id'> => ({
  ...data,
  settings: data.settings || {
    notifications: true,
    theme: 'light',
    timezone: 'America/New_York'
  },
  metadata: {
    createdAt: timestamp(),
    updatedAt: timestamp()
  }
});