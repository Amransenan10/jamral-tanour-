
import React from 'react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header / Logo Area */}
      <header className="p-8 flex flex-col items-center border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="w-32 h-32 flex items-center justify-center mb-2">
          <img src="/logo.png" alt="جمر التنور" className="w-full h-full object-contain" />
        </div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-50">نظام الولاء والمكافآت</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-24">
        {children}
      </main>

      {/* Navigation / User Info Overlay */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800 p-4 flex justify-between items-center max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <span className="text-xs font-bold text-orange-500">{(user.name || 'U').charAt(0)}</span>
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-bold">{user.name}</p>
            <p className="text-[10px] text-zinc-500">{user.role === 'CUSTOMER' ? 'عميل ذهبي' : 'طاقم العمل'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-zinc-500 hover:text-orange-500 transition-colors p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
