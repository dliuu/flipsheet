'use client';

import { useState } from 'react';
import { signIn, validateSignInData, SignInData } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess, onSwitchToSignUp }: LoginModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const signInData: SignInData = {
      email: formData.email,
      password: formData.password
    };
    
    const validation = validateSignInData(signInData);
    if (!validation.isValid) {
      setError(validation.error || 'Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { user, error } = await signIn(signInData);
      
      if (error) {
        setError(error.message);
      } else {
        onSuccess?.();
        onClose();
        router.push('/dashboard');
      }
    } catch (error) {
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
          <h2 className="text-xl font-normal text-[#111518]">Sign In</h2>
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
                disabled={isLoading || !formData.email || !formData.password}
                className="w-full px-4 py-2 bg-[#0b80ee] text-white rounded-lg hover:bg-[#0a6fd8] hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>

            {/* Switch to Sign Up */}
            {onSwitchToSignUp && (
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={onSwitchToSignUp}
                  className="text-sm text-gray-600 font-normal hover:text-gray-800 hover:underline transition-colors"
                >
                  Don't have an account?{' '}
                  <span className="text-[#0b80ee] hover:text-[#0a6fd8] font-normal">
                    Sign Up
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