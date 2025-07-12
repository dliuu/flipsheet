import { createContext, useContext, useState } from 'react';

// Define a minimal user type for the mock
interface MockUser {
  email: string;
  phoneNumber?: string;
}

interface MockAuthContextType {
  user: MockUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, phoneNumber?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    // Simulate network delay
    await new Promise(res => setTimeout(res, 500));
    setUser({ email });
    setLoading(false);
  };

  const signUp = async (email: string, password: string, phoneNumber?: string) => {
    setLoading(true);
    // Simulate network delay
    await new Promise(res => setTimeout(res, 500));
    setUser({ email, phoneNumber });
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    await new Promise(res => setTimeout(res, 300));
    setUser(null);
    setLoading(false);
  };

  return (
    <MockAuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </MockAuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a MockAuthProvider');
  }
  return context;
}; 