'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import SignUpModal from './SignUpModal';
import LoginModal from './LoginModal';

export default function Header() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleListProperty = () => {
    if (!isAuthenticated) {
      setShowSignUpModal(true);
    } else {
      window.location.href = '/create_listing';
    }
  };

  const handleSignUpSuccess = () => {
    setIsAuthenticated(true);
    setShowSignUpModal(false);
    window.location.href = '/create_listing';
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLoginModal(false);
    window.location.href = '/create_listing';
  };

  const handleCloseSignUpModal = () => {
    setShowSignUpModal(false);
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
  };

  const handleSwitchToLogin = () => {
    setShowSignUpModal(false);
    setShowLoginModal(true);
  };

  const handleSwitchToSignUp = () => {
    setShowLoginModal(false);
    setShowSignUpModal(true);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 
                className="text-xl font-bold text-[#111518] cursor-pointer hover:text-[#0b80ee] transition-colors"
                onClick={() => window.location.href = '/property_page'}
              >
                FlipSheet
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              {!isAuthenticated ? (
                <button
                  onClick={() => setShowSignUpModal(true)}
                  className="bg-[#0b80ee] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#0a6fd8] transition-colors"
                >
                  Sign Up
                </button>
              ) : (
                pathname !== '/create_listing' && (
                  <button
                    onClick={() => setShowSignUpModal(true)}
                    className="bg-[#0b80ee] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#0a6fd8] transition-colors"
                  >
                    Sign Up
                  </button>
                )
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={showSignUpModal}
        onClose={handleCloseSignUpModal}
        onSuccess={handleSignUpSuccess}
        onSwitchToLogin={handleSwitchToLogin}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={handleCloseLoginModal}
        onSuccess={handleLoginSuccess}
        onSwitchToSignUp={handleSwitchToSignUp}
      />
    </>
  );
} 