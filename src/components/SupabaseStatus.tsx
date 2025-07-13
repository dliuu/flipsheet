'use client';

import { useEffect, useState } from 'react';

export default function SupabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'configured' | 'not-configured'>('checking');

  useEffect(() => {
    const checkConfig = () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const isConfigured = typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey && 
        supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined' &&
        supabaseUrl !== '' && supabaseAnonKey !== '';
      
      setStatus(isConfigured ? 'configured' : 'not-configured');
    };

    checkConfig();
  }, []);

  if (status === 'checking') {
    return null;
  }

  if (status === 'not-configured' && process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg text-sm z-50">
        <div className="font-semibold">Supabase Not Configured</div>
        <div className="text-xs mt-1">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file
        </div>
      </div>
    );
  }

  return null;
} 