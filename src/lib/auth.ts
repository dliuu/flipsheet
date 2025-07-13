import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
}

let currentUser: AuthUser | null = null;
let authListeners: ((user: AuthUser | null) => void)[] = [];

export const subscribeToAuthChanges = (callback: (user: AuthUser | null) => void) => {
  authListeners.push(callback);
  return () => {
    const index = authListeners.indexOf(callback);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
};

const notifyAuthListeners = (user: AuthUser | null) => {
  currentUser = user;
  authListeners.forEach(callback => callback(user));
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return false;
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return false;
    }
    return !!user;
  } catch {
    return false;
  }
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return null;
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return null;
    }
    const authUser: AuthUser = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name,
      phone_number: user.user_metadata?.phone_number
    };
    currentUser = authUser;
    return authUser;
  } catch {
    return null;
  }
};

export const signUp = async (data: SignUpData): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone_number: data.phoneNumber
        },
      },
    });
    if (error) {
      return { user: null, error: { message: error.message } };
    }
    if (authData.user) {
      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email || '',
        full_name: data.fullName,
        phone_number: data.phoneNumber
      };
      notifyAuthListeners(user);
      return { user, error: null };
    }
    return { user: null, error: null };
  } catch (error: any) {
    return { 
      user: null, 
      error: { message: error.message || 'An unexpected error occurred during sign up.' } 
    };
  }
};

export const signIn = async (data: SignInData): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      return { user: null, error: { message: error.message } };
    }
    if (authData.user) {
      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email || '',
        full_name: authData.user.user_metadata?.full_name,
        phone_number: authData.user.user_metadata?.phone_number
      };
      notifyAuthListeners(user);
      return { user, error: null };
    }
    return { user: null, error: null };
  } catch (error: any) {
    return { 
      user: null, 
      error: { message: error.message || 'An unexpected error occurred during sign in.' } 
    };
  }
};

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: { message: error.message } };
    }
    notifyAuthListeners(null);
    return { error: null };
  } catch (error: any) {
    return { 
      error: { message: error.message || 'An unexpected error occurred during sign out' } 
    };
  }
};

export const getSession = async (): Promise<{ session: any | null; error: AuthError | null }> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      return { session: null, error: { message: error.message } };
    }
    return { session, error: null };
  } catch (error: any) {
    return { 
      session: null, 
      error: { message: error.message || 'An unexpected error occurred getting session' } 
    };
  }
};

export const initializeAuth = () => {
  supabase.auth.onAuthStateChange(async (event: string, session: any) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const user: AuthUser = {
        id: session.user.id,
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name,
        phone_number: session.user.user_metadata?.phone_number
      };
      notifyAuthListeners(user);
    } else if (event === 'SIGNED_OUT') {
      notifyAuthListeners(null);
    }
  });
};

export const validateSignUpData = (data: SignUpData): { isValid: boolean; error?: string } => {
  if (!data.email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  if (!data.password) {
    return { isValid: false, error: 'Password is required' };
  }
  if (data.password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }
  if (!data.fullName.trim()) {
    return { isValid: false, error: 'Full name is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true };
};

export const validateSignInData = (data: SignInData): { isValid: boolean; error?: string } => {
  if (!data.email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  if (!data.password) {
    return { isValid: false, error: 'Password is required' };
  }
  return { isValid: true };
};

export const getCachedUser = (): AuthUser | null => {
  return currentUser;
};