'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, checkConnection, getSupabase } from './supabase';
import { User, UserRole, ADMIN_PERMISSIONS } from '@/types/auth';
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
      console.error('Error fetching profile:', error);
      // Fallback to session data if profile fetch fails (e.g. trigger didn't run)
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.id === userId) {
        const role = (session.user.user_metadata?.role as UserRole) || 'PROFESSIONAL';
        const isAdmin = role === 'ADMIN';
        
        const fallbackUser: User = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
          role: role,
          avatar: `https://picsum.photos/seed/${session.user.id}/200/200`,
          permissions: isAdmin ? ADMIN_PERMISSIONS : [],
        };
        setUser(fallbackUser);
      }
      return;
    }

    if (data) {
      console.log('Profile data fetched:', data);
      const role = data.role as UserRole;
      const isAdmin = role === 'ADMIN';
      
      // ADMINs sempre recebem todas as permissões; outros recebem as do perfil
      const finalPermissions = isAdmin 
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

    const handleFocus = async () => {
      console.log('Tab focused, verifying session and connection...');
      const isAlive = await checkConnection();
      if (!isAlive) {
        setConnectionStatus('offline');
        // Tenta recuperar se estiver offline
        setTimeout(() => refreshConnection(), 2000);
      } else {
        setConnectionStatus('online');
      }
      
      const client = getSupabase();
      if (client) {
        const { data: { session: currentSession } } = await client.auth.getSession();
        if (currentSession && !session) {
          setSession(currentSession);
          await fetchProfile(currentSession.user.id);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', () => {
       console.log('Browser is online');
       refreshConnection();
    });
    window.addEventListener('offline', () => {
       console.log('Browser is offline');
       setConnectionStatus('offline');
    });

    // Heartbeat a cada 2 minutos
    const heartbeat = setInterval(async () => {
      const isAlive = await checkConnection();
      setConnectionStatus(isAlive ? 'online' : 'offline');
    }, 120000);

    return () => {
      if (subscription) subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', () => refreshConnection());
      window.removeEventListener('offline', () => setConnectionStatus('offline'));
      clearInterval(heartbeat);
    };
  }, [session]);

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
