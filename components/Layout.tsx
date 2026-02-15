
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
      <header className="p-6 flex flex-col items-center border-b border-zinc-800">
        <div className="w-20 h-20 bg-orange-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(234,88,12,0.3)] mb-4">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99a7.99 0 01-4.812 10.27L15 19l2.657-2.343z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black tracking-widest text-orange-500 uppercase">جمر التنور</h1>
        <p className="text-zinc-500 text-sm mt-1">نظام الولاء والمكافآت</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-24">
        {children}
      </main>

      {/* Navigation / User Info Overlay */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800 p-4 flex justify-between items-center max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <span className="text-xs font-bold text-orange-500">{user.name.charAt(0)}</span>
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
