"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
import type { Database } from './supabase';

type User = {
  id: number;
  email: string;
  name: string;
  role: 'student' | 'driver' | 'admin';
  driver_number?: string;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (data: { email: string; password: string; name: string; role: 'student' | 'driver' | 'admin'; driver_number?: string }) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to safely access localStorage
const getLocalStorage = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

// Helper function to safely set localStorage
const setLocalStorage = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

// Helper function to safely remove from localStorage
const removeLocalStorage = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = getLocalStorage('sbup_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        // If there's an error parsing the stored user, clear it
        removeLocalStorage('sbup_user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Invalid credentials');

      setUser(data);
      setLocalStorage('sbup_user', JSON.stringify(data));
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signup = async ({ email, password, name, role, driver_number }: { 
    email: string; 
    password: string; 
    name: string; 
    role: 'student' | 'driver' | 'admin';
    driver_number?: string;
  }) => {
    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select()
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            password,
            name,
            role,
            driver_number: role === 'driver' ? driver_number : null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      setLocalStorage('sbup_user', JSON.stringify(data));
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    setUser(null);
    removeLocalStorage('sbup_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 