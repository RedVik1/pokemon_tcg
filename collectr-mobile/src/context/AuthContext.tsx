import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getToken, logout as apiLogout } from '../api';

interface AuthContextType {
  token: string | null;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  isLoading: true,
  setToken: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const didLoad = useRef(false);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    loadToken();
  }, []);

  async function loadToken() {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    try {
      const stored = await getToken();
      setTokenState(stored);
    } catch {
      setTokenState(null);
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
  };

  const logout = async () => {
    await apiLogout();
    setTokenState(null);
  };

  return (
    <AuthContext.Provider value={{ token, isLoading, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
