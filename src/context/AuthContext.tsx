import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, UserPreferences } from '../types/database';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ error: any }>;
  signUp: (email: string, name: string, role: 'customer' | 'restaurant' | 'driver', preferences?: UserPreferences) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updatePreferences: (preferences: UserPreferences) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          // In real Supabase, we would select from profiles.
          // In mock, session contains user. Let's retrieve from database.
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (data) {
            setUser(data as UserProfile);
          } else {
            setUser(session.user as any as UserProfile);
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, []);

  const signIn = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123' // Mock password for quick login
      });
      if (error) return { error };

      if (data && data.user) {
        // Fetch full profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        setUser((profile as UserProfile) || (data.user as any as UserProfile));
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUp = async (
    email: string,
    name: string,
    role: 'customer' | 'restaurant' | 'driver',
    preferences?: UserPreferences
  ) => {
    const defaultPrefs: UserPreferences = preferences || {
      diet: 'none',
      targetCalories: 2000,
      allergies: []
    };

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123',
        options: {
          data: {
            name,
            role,
            preferences: defaultPrefs
          }
        }
      });
      if (error) return { error };

      if (data && data.user) {
        // Fetch full profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        setUser((profile as UserProfile) || (data.user as any as UserProfile));
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updatePreferences = async (preferences: UserPreferences) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ preferences })
        .eq('id', user.id);
      
      if (!error) {
        setUser(prev => prev ? { ...prev, preferences } : null);
      } else {
        console.error('Failed to update preferences:', error);
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
