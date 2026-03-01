import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authService } from '@/services/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface MfaPending {
  mfa_token: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<MfaPending | void>;
  demoLogin: (email: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: 'consumer' | 'agent' | 'agency_owner' | 'carrier';
    agency_code?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  verifyMfa: (mfaToken: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const clearAuth = useCallback(() => {
    localStorage.removeItem('auth_token');
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.me();
      const user = response.user ?? response as unknown as User;
      if (user?.id) {
        setState({ user, isAuthenticated: true, isLoading: false });
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    }
  }, [clearAuth]);

  // Bootstrap: check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      refreshUser();
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [refreshUser]);

  // Listen for 401 events from the API client
  useEffect(() => {
    const handleUnauthorized = () => clearAuth();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [clearAuth]);

  const login = async (email: string, password: string): Promise<MfaPending | void> => {
    const response = await authService.login(email, password);
    if (response.mfa_required && response.mfa_token) {
      return { mfa_token: response.mfa_token };
    }
    localStorage.setItem('auth_token', response.token);
    setState({ user: response.user, isAuthenticated: true, isLoading: false });
  };

  const verifyMfa = async (mfaToken: string, code: string) => {
    const response = await authService.mfaVerify({ mfa_token: mfaToken, code });
    localStorage.setItem('auth_token', response.token);
    setState({ user: response.user, isAuthenticated: true, isLoading: false });
  };

  const demoLogin = async (email: string) => {
    const response = await authService.demoLogin(email);
    localStorage.setItem('auth_token', response.token);
    setState({ user: response.user, isAuthenticated: true, isLoading: false });
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: 'consumer' | 'agent' | 'agency_owner' | 'carrier';
    agency_code?: string;
  }) => {
    const response = await authService.register(data);
    localStorage.setItem('auth_token', response.token);
    setState({ user: response.user, isAuthenticated: true, isLoading: false });
  };

  const setToken = async (token: string) => {
    localStorage.setItem('auth_token', token);
    await refreshUser();
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, demoLogin, register, logout, refreshUser, setToken, verifyMfa }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
