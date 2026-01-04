import React, { useState, useEffect } from 'react';
import { MessageSquare, Settings, LogOut, Menu, X, HelpCircle, Zap, Clock, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: 'chat' | 'settings' | 'help';
  onNavigate: (page: 'chat' | 'settings' | 'help') => void;
  credits: number | null;
  nextRefill: string | null; // New Prop
  onTriggerPro: () => void;  // New Prop
}

export default function AppLayout({ children, currentPage, onNavigate, credits, nextRefill, onTriggerPro }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // Countdown Logic (hh:mm:ss)
  useEffect(() => {
    if (!nextRefill) return;
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const refillTime = new Date(nextRefill).getTime();
      const distance = refillTime - now;

      if (distance < 0) {
        setTimeLeft("Ready to refill!");
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Format with leading zeros: 02:05:09
        const h = String(hours).padStart(2, '0');
        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(2, '0');
        
        setTimeLeft(`${h}:${m}:${s}`);
      }
    };

    updateTimer(); // Run once immediately
    const timer = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(timer);
  }, [nextRefill]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const NavItem = ({ page, icon: Icon, label }: { page: 'chat' | 'settings' | 'help', icon: any, label: string }) => (
    <button
      onClick={() => {
        onNavigate(page);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        currentPage === page 
          ? 'bg-indigo-50 text-indigo-600 font-medium' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  const CreditCounter = () => (
    <div className="mx-4 mt-auto mb-4 p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-indigo-600">Daily Plan</span>
        <Zap size={14} className="text-amber-500 fill-amber-500" />
      </div>
      
      <div className="flex items-end gap-1 mb-1">
        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {credits !== null ? credits : '-'}
        </div>
        <span className="text-sm font-normal text-slate-400 mb-1">/5</span>
      </div>

      {/* Countdown Timer */}
      {credits !== null && credits < 5 && (
         <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-white/60 p-1.5 rounded-md mb-3 border border-indigo-100/50">
            <Clock size={10} className="text-indigo-400" />
            <span>Refill in: <span className="font-mono font-medium text-indigo-600">{timeLeft}</span></span>
         </div>
      )}
      
      {/* Privacy Badge (Trust Feature) */}
      <div className="flex items-center gap-1.5 mb-3 opacity-60 px-1">
        <ShieldCheck size={10} className="text-green-600"/>
        <span className="text-[10px] text-slate-400 font-medium">100% Private & Secure</span>
      </div>
      
      <button 
        onClick={onTriggerPro} // Triggers Modal -> then Razorpay
        className="w-full py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
      >
        Upgrade to Unlimited
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-slate-50/50 backdrop-blur-xl fixed h-full z-20">
        <div className="p-6 flex items-center space-x-3">
          <img src="/favicon.png" alt="Kue Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Kue
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem page="chat" icon={MessageSquare} label="Chat Profiles" />
          <NavItem page="settings" icon={Settings} label="Settings" />
          <NavItem page="help" icon={HelpCircle} label="How to Use" />
        </nav>

        <CreditCounter />

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src="/favicon.png" alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-lg text-slate-900">Kue</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="text-slate-600" /> : <Menu className="text-slate-600" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-white pt-20 px-4 md:hidden flex flex-col transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'opacity-100 visible translate-y-0' 
            : 'opacity-0 invisible -translate-y-2 pointer-events-none'
        }`}
      >
         <nav className="space-y-2 flex-1">
          <NavItem page="chat" icon={MessageSquare} label="Chat Profiles" />
          <NavItem page="settings" icon={Settings} label="Settings" />
          <NavItem page="help" icon={HelpCircle} label="How to Use" />
        </nav>
        
        <div className="pb-8 space-y-4">
          <CreditCounter />
          <button 
            onClick={handleLogout} 
            className="flex items-center space-x-3 text-red-500 w-full px-4 py-3 border-t border-slate-100"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}