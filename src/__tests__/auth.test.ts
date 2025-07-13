// Only import the real Supabase client and auth functions
import {
  signUp,
  signIn,
  signOut,
  isAuthenticated,
  getCurrentUser,
  getSession,
  initializeAuth,
  subscribeToAuthChanges,
  validateSignUpData,
  validateSignInData,
  getCachedUser,
  type AuthUser,
  type SignUpData,
  type SignInData,
} from '../lib/auth';

describe('Auth Functions (Real Supabase)', () => {
  // Only keep tests that are valid for a real Supabase connection
  // You may want to add integration tests here for your real Supabase project
  // For now, we keep only validation and structure tests

  describe('validateSignUpData', () => {
    it('should validate valid sign up data', () => {
      const validData: SignUpData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
        phoneNumber: '+1234567890',
      };
      const result = validateSignUpData(validData);
      expect(result).toEqual({ isValid: true });
    });
    it('should reject empty email', () => {
      const invalidData: SignUpData = {
        email: '',
        password: 'password123',
        fullName: 'John Doe',
      };
      const result = validateSignUpData(invalidData);
      expect(result).toEqual({
        isValid: false,
        error: 'Email is required',
      });
    });
    it('should reject empty password', () => {
      const invalidData: SignUpData = {
        email: 'test@example.com',
        password: '',
        fullName: 'John Doe',
      };
      const result = validateSignUpData(invalidData);
      expect(result).toEqual({
        isValid: false,
        error: 'Password is required',
      });
    });
    it('should reject short password', () => {
      const invalidData: SignUpData = {
        email: 'test@example.com',
        password: '12345',
        fullName: 'John Doe',
      };
      const result = validateSignUpData(invalidData);
      expect(result).toEqual({
        isValid: false,
        error: 'Password must be at least 6 characters long',
      });
    });
    it('should reject empty full name', () => {
      const invalidData: SignUpData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: '',
      };
      const result = validateSignUpData(invalidData);
      expect(result).toEqual({
        isValid: false,
        error: 'Full name is required',
      });
    });
    it('should reject invalid email format', () => {
      const invalidData: SignUpData = {
        email: 'invalid-email',
        password: 'password123',
        fullName: 'John Doe',
      };
      const result = validateSignUpData(invalidData);
      expect(result).toEqual({
        isValid: false,
        error: 'Please enter a valid email address',
      });
    });
    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];
      validEmails.forEach(email => {
        const validData: SignUpData = {
          email,
          password: 'password123',
          fullName: 'John Doe',
        };
        const result = validateSignUpData(validData);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateSignInData', () => {
    it('should validate valid sign in data', () => {
      const validData: SignInData = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = validateSignInData(validData);
      expect(result).toEqual({ isValid: true });
    });
    it('should reject empty email', () => {
      const invalidData: SignInData = {
        email: '',
        password: 'password123',
      };
      const result = validateSignInData(invalidData);
      expect(result).toEqual({
        isValid: false,
        error: 'Email is required',
      });
    });
    it('should reject empty password', () => {
      const invalidData: SignInData = {
        email: 'test@example.com',
        password: '',
      };
      const result = validateSignInData(invalidData);
      expect(result).toEqual({
        isValid: false,
        error: 'Password is required',
      });
    });
    it('should reject whitespace-only email', () => {
      const invalidData: SignInData = {
        email: '   ',
        password: 'password123',
      };
      const result = validateSignInData(invalidData);
      expect(result).toEqual({
        isValid: false,
        error: 'Email is required',
      });
    });
  });
}); 