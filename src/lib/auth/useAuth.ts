import { useState, useEffect } from 'react';
import { 
  AuthUser, 
  subscribeToAuthChanges, 
  getCurrentUser, 
  signIn, 
  signUp, 
  signOut,
  isAuthenticated,
  SignInData,
  SignUpData
} from './index';

export interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (data: SignInData) => Promise<{ user: AuthUser | null; error: { message: string } | null }>;
  signUp: (data: SignUpData) => Promise<{ user: AuthUser | null; error: { message: string } | null }>;
  signOut: () => Promise<{ error: { message: string } | null }>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial user state
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Don't set user to null on error, let it remain undefined until we get a proper response
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure Supabase is properly initialized
    const timer = setTimeout(() => {
      initializeAuth();
    }, 100);

    // Subscribe to auth changes
    const unsubscribe = subscribeToAuthChanges((newUser) => {
      setUser(newUser);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const handleSignIn = async (data: SignInData) => {
    return await signIn(data);
  };

  const handleSignUp = async (data: SignUpData) => {
    return await signUp(data);
  };

  const handleSignOut = async () => {
    return await signOut();
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };
}; 