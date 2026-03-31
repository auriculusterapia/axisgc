'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, checkConnection, getSupabase } from './supabase';
import { User, UserRole, ADMIN_PERMISSIONS, ROLE_PERMISSIONS } from '@/types/auth';
import { logAction } from './auditLogService';

interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  connectionStatus: 'online' | 'offline' | 'reconnecting';
  refreshConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'reconnecting'>('online');

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Profile fetch failed, using fallback:', error.message);
      // Fallback robusto usando ROLE_PERMISSIONS[role]
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession && currentSession.user.id === userId) {
        const role = (currentSession.user.user_metadata?.role as UserRole) || 'PROFESSIONAL';
        const fallbackUser: User = {
          id: currentSession.user.id,
          name: currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0] || 'Usuário',
          email: currentSession.user.email || '',
          role: role,
          avatar: `https://picsum.photos/seed/${currentSession.user.id}/200/200`,
          permissions: (ROLE_PERMISSIONS as any)[role] || [],
        };
        setUser(fallbackUser);
      }
      return;
    }

    if (data) {
      const role = data.role as UserRole;
      const isAdmin = role === 'ADMIN';
      
      const finalPermissions = isAdmin 
        ? ADMIN_PERMISSIONS 
        : Array.isArray(data.permissions) && data.permissions.length > 0
          ? data.permissions
          : (ROLE_PERMISSIONS as any)[role] || [];
      
      const userData: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: role,
        avatar: data.avatar_url || undefined,
        permissions: finalPermissions,
      };
      setUser(userData);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (!supabase) {
        if (mounted) setLoading(false);
        return;
      }

      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(initialSession);
        if (initialSession) {
          await fetchProfile(initialSession.user.id);
        }
        setLoading(false);
      }
    };

    initAuth();

    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth event change:', event);
      if (mounted) {
        setSession(currentSession);
        if (currentSession) {
          if (event === 'SIGNED_IN') {
            logAction({ action: 'LOGIN', entityType: 'AUTH', userId: currentSession.user.id, details: { method: 'email' } });
          }
          await fetchProfile(currentSession.user.id);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    const handleFocus = async () => {
      const isAlive = await checkConnection();
      if (!isAlive) {
        if (mounted) setConnectionStatus('offline');
        setTimeout(() => refreshConnection(), 2000);
      } else {
        if (mounted) setConnectionStatus('online');
        
        const client = getSupabase();
        if (client) {
          const { data: { session: focusedSession } } = await client.auth.getSession();
          if (focusedSession && mounted) {
            setSession(focusedSession);
            // Só busca o perfil se ainda não tivermos ele ou se for uma nova sessão
            if (!user || user.id !== focusedSession.user.id) {
               await fetchProfile(focusedSession.user.id);
            }
          }
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', refreshConnection);
    window.addEventListener('offline', () => mounted && setConnectionStatus('offline'));

    const heartbeat = setInterval(async () => {
      const isAlive = await checkConnection();
      if (mounted) setConnectionStatus(isAlive ? 'online' : 'offline');
    }, 120000);

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', refreshConnection);
      window.removeEventListener('offline', () => setConnectionStatus('offline'));
      clearInterval(heartbeat);
    };
  }, []);

  const refreshConnection = async () => {
    setConnectionStatus('reconnecting');
    const isAlive = await checkConnection();
    if (isAlive) {
      setConnectionStatus('online');
    } else {
      // Força recriação do cliente se falhar o check inicial
      getSupabase(true);
      const retryAlive = await checkConnection();
      setConnectionStatus(retryAlive ? 'online' : 'offline');
    }
  };

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
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, connectionStatus, refreshConnection }}>
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
