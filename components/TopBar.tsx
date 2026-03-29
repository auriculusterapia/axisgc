'use client';

import { Search, Bell, HelpCircle, User as UserIcon, LogOut } from 'lucide-react';
import { User, ROLE_LABELS } from '@/types/auth';
import { getInitials } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface TopBarProps {
  user?: User | null;
  onLogout?: () => void;
}

export default function TopBar({ user, onLogout }: TopBarProps) {
  const [profileName, setProfileName] = useState(user?.name || 'Dr. Elena Wu');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auriculocare_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.name) {
            setProfileName(parsed.name);
          }
        } catch (e) {}
      } else if (user?.name) {
        setProfileName(user.name);
      }
    }
  }, [user]);

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-outline-variant/10 sticky top-0 z-40">
      <div className="flex items-center gap-8 w-1/2">
        <span className="text-lg font-bold text-primary font-headline">Axis GC</span>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
          <input 
            type="text" 
            placeholder="Buscar paciente ou histórico..." 
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="p-2.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
          <HelpCircle size={20} />
        </button>
        <div className="h-8 w-[1px] bg-outline-variant/30 mx-2"></div>
        <div className="flex items-center gap-3 pl-2 group relative">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-on-surface">{profileName}</p>
            <p className="text-[10px] text-on-surface-variant font-medium">{user ? ROLE_LABELS[user.role] : 'Profissional'}</p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm border border-primary/20 overflow-hidden relative">
            {getInitials(profileName)}
          </div>
          
          {/* Logout Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-outline-variant/10 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all p-2">
            <p className="px-4 py-2 text-[10px] text-outline uppercase tracking-widest font-bold border-b border-outline-variant/5 mb-1">{user?.email}</p>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all"
            >
              <LogOut size={18} /> Sair do Sistema
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
