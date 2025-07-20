'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import SignUpModal from './SignUpModal';
import LoginModal from './LoginModal';

export default function Header() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Don't render auth-dependent UI until loading is complete
  if (isLoading) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-[#111518] cursor-pointer hover:text-[#0b80ee] transition-colors">
                FlipSheet
              </h1>
            </div>
            <nav className="flex items-center space-x-4">
              <div className="w-20 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </nav>
          </div>
        </div>
      </header>
    );
  }

  const handleListProperty = () => {
    if (!isAuthenticated) {
      setShowSignUpModal(true);
    } else {
      window.location.href = '/create_listing';
    }
  };

  const handleSignUpSuccess = () => {
    setShowSignUpModal(false);
    window.location.href = '/create_listing';
  };

  const handleLoginSuccess = () => {
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

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleDashboardClick = () => {
    setShowDropdown(false);
    window.location.href = '/dashboard';
  };

  const handleLogoutClick = async () => {
    setShowDropdown(false);
    await signOut();
    window.location.href = '/';
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
                onClick={() => window.location.href = '/'}
              >
                FlipSheet
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              {!isAuthenticated && (
                <button
                  onClick={() => setShowSignUpModal(true)}
                  className="bg-[#0b80ee] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#0a6fd8] transition-colors"
                >
                  Sign Up
                </button>
              )}
              
              {/* Profile Picture with Dropdown */}
              {isAuthenticated && (
                <div className="relative" ref={dropdownRef}>
                  <div 
                    className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-400 transition-colors"
                    onClick={handleProfileClick}
                  >
                    <svg 
                      className="w-6 h-6 text-gray-600" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 transform transition-all duration-200 ease-out opacity-100 scale-100">
                      <button
                        onClick={handleDashboardClick}
                        className="w-full px-4 py-3 text-left text-[#111518] text-sm font-normal leading-normal hover:bg-gray-50 transition-colors flex items-center"
                        style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}
                      >
                        <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
                        </svg>
                        Dashboard
                      </button>
                      <button
                        onClick={handleLogoutClick}
                        className="w-full px-4 py-3 text-left text-red-600 text-sm font-normal leading-normal hover:bg-red-50 transition-colors flex items-center"
                        style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}
                      >
                        <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
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