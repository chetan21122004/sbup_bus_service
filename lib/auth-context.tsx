"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
import type { Database } from './supabase';

type User = Database['users'] & { password?: never };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, name: string, role: 'student' | 'driver') => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Invalid credentials');

      const { password: _, ...userWithoutPassword } = data;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'student' | 'driver') => {
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
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const { password: _, ...userWithoutPassword } = data;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
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