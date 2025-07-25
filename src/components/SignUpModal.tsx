'use client';

import { useState } from 'react';
import { signUp, validateSignUpData, SignUpData } from '@/lib/auth';
import { createPropertyWithPhotos } from '@/lib/database';
import { useRouter } from 'next/navigation';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  pendingProperty?: any; // Add support for pending property data
}

export default function SignUpModal({ isOpen, onClose, onSuccess, onSwitchToLogin, pendingProperty }: SignUpModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
    
    // Real-time password validation
    if (name === 'password' || name === 'confirmPassword') {
      const password = name === 'password' ? value : formData.password;
      const confirmPassword = name === 'confirmPassword' ? value : formData.confirmPassword;
      
      if (confirmPassword && password !== confirmPassword) {
        setPasswordError('Passwords do not match');
      } else {
        setPasswordError('');
      }
    }
  };

  const validateForm = () => {
    const signUpData: SignUpData = {
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName
    };
    
    const validation = validateSignUpData(signUpData);
    if (!validation.isValid) {
      setError(validation.error || 'Validation failed');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const signUpData: SignUpData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName
      };
      
      // Step 1: Create the user
      const { user, error } = await signUp(signUpData);
      
      if (error) {
        setError(error.message);
        return;
      }

      if (!user) {
        setError('Failed to create user account');
        return;
      }

      // If there's a pending property, create it with the new user's ID
      if (pendingProperty) {
        try {
          // Step 2: Create the property with the new user's ID
          const property = await createPropertyWithPhotos(
            pendingProperty.propertyData,
            pendingProperty.photos
          );

          // Success - both user and property created
          onSuccess?.();
          onClose();
          router.push(`/property_page?id=${property.id}`);
        } catch (propertyError: any) {
          setError(`Account created successfully, but failed to create property: ${propertyError.message}`);
          // Still close modal and redirect since user was created
          onClose();
          router.push('/dashboard');
        }
      } else {
        // No pending property, just redirect to create listing
        onSuccess?.();
        onClose();
        router.push('/create_listing');
      }
    } catch (error: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-normal text-[#111518]">Sign Up</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:scale-110 transition-all duration-200 ease-in-out"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {pendingProperty && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm">
                Create an account to list your property: <strong>{pendingProperty.propertyData.title}</strong>
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-normal text-[#111518] mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] placeholder:text-[#6a7681] text-sm font-normal"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-normal text-[#111518] mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] placeholder:text-[#6a7681] text-sm font-normal"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-normal text-[#111518] mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] placeholder:text-[#6a7681] text-sm font-normal"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-normal text-[#111518] mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] placeholder:text-[#6a7681] text-sm font-normal"
                required
              />
            </div>

            {/* Password Error Alert */}
            {passwordError && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 text-sm font-normal">{passwordError}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg font-normal">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !!passwordError || !formData.email || !formData.password || !formData.confirmPassword || !formData.fullName}
                className="w-full px-4 py-2 bg-[#0b80ee] text-white rounded-lg hover:bg-[#0a6fd8] hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>

            {/* Switch to Login */}
            {onSwitchToLogin && (
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-sm text-gray-600 font-normal hover:text-gray-800 hover:underline transition-colors"
                >
                  Already have an account?{' '}
                  <span className="text-[#0b80ee] hover:text-[#0a6fd8] font-normal">
                    Sign In
                  </span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 