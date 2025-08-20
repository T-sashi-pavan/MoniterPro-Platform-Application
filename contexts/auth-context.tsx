"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  isLoading: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user is logged in from localStorage
    try {
      const savedUser = localStorage.getItem('monitoring_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error parsing saved user:', error);
      // Remove invalid data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('monitoring_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Prevent hydration mismatch - show loading state until mounted
  if (!mounted) {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          login: async () => false,
          register: async () => false,
          logout: () => {},
          isLoading: true,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3333/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const userData: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role
        };
        
        setUser(userData);
        localStorage.setItem('monitoring_user', JSON.stringify(userData));
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: string = 'viewer'): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3333/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const userData: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role
        };
        
        setUser(userData);
        localStorage.setItem('monitoring_user', JSON.stringify(userData));
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('monitoring_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
