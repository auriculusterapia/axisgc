'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Lock, User as UserIcon, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { User } from '@/types/auth';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Configuração do Supabase ausente. Verifique as variáveis de ambiente.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const trimmedEmail = email.trim();
      
      if (trimmedEmail.toLowerCase() === 'admin' || password.toLowerCase() === 'admin') {
        setError('As credenciais "admin/admin" não são mais válidas. Por favor, use seu e-mail.');
        setIsLoading(false);
        return;
      }

      await signIn(trimmedEmail, password);
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.message === 'Invalid login credentials') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(err.message || 'Erro ao processar solicitação.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-primary/5 border border-outline-variant/10 p-10 relative z-10"
      >
        {!supabase && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800">
            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
            <div className="text-xs">
              <p className="font-bold mb-1">Configuração Necessária</p>
              <p>As variáveis de ambiente do Supabase não foram configuradas. O login não funcionará até que você as adicione nas configurações.</p>
            </div>
          </div>
        )}

        <div className="text-center mb-10">
          <div className="w-[100px] h-[100px] flex items-center justify-center mx-auto mb-6">
            <Image 
              src="/Axis_sistemas_Favicon.png" 
              alt="Axis GC" 
              width={100} 
              height={100} 
              className="object-contain drop-shadow-xl"
            />
          </div>
          <h1 className="text-3xl font-bold font-headline text-on-surface">
            Bem-Vindo ao Axis GC
          </h1>
          <p className="text-on-surface-variant mt-2 font-medium">
            Sistema de Gestão de Clínicas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase tracking-widest ml-1">E-mail Profissional</label>
            <div className="relative group">
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={20} />
              <input 
                required
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@clinica.com"
                className="w-full pl-14 pr-6 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase tracking-widest ml-1">Senha de Acesso</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={20} />
              <input 
                required
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-14 pr-14 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs font-bold p-3 rounded-xl text-center text-rose-500 bg-rose-50"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={isLoading || !supabase}
            className="w-full py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Entrar no Sistema <CheckCircle2 size={20} /></>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
