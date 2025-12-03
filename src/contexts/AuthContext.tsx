'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User, AuthResponse } from '@/types';
import { jwtDecode } from 'jwt-decode';

/**
 * Authentication Context
 * Manages user authentication state, login/logout, and token validation
 */

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (utorid: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Check if JWT token has expired
   * Decodes token and compares expiration time with current time
   */
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  /**
   * Fetch current user data from API
   * Validates token before making request
   */
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        setLoading(false);
        return;
      }

      const response = await api.get<User>('/users/me');
      setUser(response.data);
    } catch (error) {
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
    } finally {
      setLoading(false);
    }
  };

  // Load user data on mount
  useEffect(() => {
    fetchUser();
  }, []);

  /**
   * Login user with UTORid and password
   * Stores token and fetches user data on success
   */
  const login = async (utorid: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/tokens', {
        utorid,
        password,
      });

      const { token, expiresAt } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('tokenExpiry', expiresAt);

      // Fetch user data after successful login
      const userResponse = await api.get<User>('/users/me');
      setUser(userResponse.data);

      router.push('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  /**
   * Logout user
   * Clears token and user data, redirects to login
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    setUser(null);
    router.push('/login');
  };

  /**
   * Refresh user data
   * Used to update user state after profile changes
   */
  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth hook
 * Provides access to authentication context
 * Must be used within AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}