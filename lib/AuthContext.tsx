'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User, UserRole, ADMIN_PERMISSIONS, ROLE_PERMISSIONS } from '@/types/auth';
import { logAction } from './auditLogService';

interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      // Fallback to session data if profile fetch fails (e.g. trigger didn't run)
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.id === userId) {
        const isSpecialAdmin = session.user.email === 'auriculusterapia@gmail.com';
        const role = isSpecialAdmin ? 'ADMIN' : ((session.user.user_metadata?.role as UserRole) || 'PROFESSIONAL');
        
        const fallbackUser: User = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
          role: role,
          avatar: `https://picsum.photos/seed/${session.user.id}/200/200`,
          permissions: isSpecialAdmin ? ADMIN_PERMISSIONS : [],
        };
        setUser(fallbackUser);
      }
      return;
    }

    if (data) {
      console.log('Profile data fetched:', data);
      const isSpecialAdmin = data.email === 'auriculusterapia@gmail.com';
      const role = isSpecialAdmin ? 'ADMIN' : (data.role as UserRole);
      
      // Prioritize DB permissions, then role defaults
      const finalPermissions = isSpecialAdmin 
        ? ADMIN_PERMISSIONS 
        : Array.isArray(data.permissions)
          ? data.permissions
          : [];
      
      const userData: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: role,
        avatar: data.avatar_url || undefined,
        permissions: finalPermissions,
      };
      console.log('User data set in context:', userData);
      setUser(userData);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        // Check active sessions and sets the user
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          // If refresh token is invalid, clear everything
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('invalid_grant')) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
          }
        } else {
          setSession(session);
          if (session) {
            await fetchProfile(session.user.id);
          }
        }
      } catch (err) {
        console.error('Unexpected session check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    if (!supabase) return;

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        if (event === 'SIGNED_IN') {
          logAction({ action: 'LOGIN', entityType: 'AUTH', userId: session.user.id, details: { method: 'email' } });
        }
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password?: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    // For demo purposes, we might use a simple sign in or magic link
    // If password is provided, use it, otherwise use magic link
    if (password) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
      });
      if (error) throw error;
    }
  };

  const signOut = async () => {
    try {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          await logAction({ action: 'LOGOUT', entityType: 'AUTH', userId: session.user.id });
        }
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    } finally {
      // Always clear local state
      setUser(null);
      setSession(null);
      console.log('Local auth state cleared');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
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
