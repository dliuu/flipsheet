'use client';

import { useEffect } from 'react';
import { initializeAuth } from '@/lib/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    // Add a small delay to ensure Supabase is properly initialized
    const timer = setTimeout(() => {
      try {
        initializeAuth();
      } catch (error) {
        console.warn('Failed to initialize auth:', error);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
} 