import React, { useState, useEffect } from 'react';
import { MessageSquare, Settings, LogOut, Menu, X, HelpCircle, Zap } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: 'chat' | 'settings' | 'help';
  onNavigate: (page: 'chat' | 'settings' | 'help') => void;
}

export default function AppLayout({ children, currentPage, onNavigate }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  // Fetch user credits on mount
  useEffect(() => {
    const fetchCredits = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_credits')
          .select('credits_remaining')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setCredits(data.credits_remaining);
        }
      }
    };
    fetchCredits();
  }, []);

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
          ? 'bg-primary/10 text-primary font-medium' 
          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  // The Credit Counter UI Component
  const CreditCounter = () => (
    <div className="mx-4 mt-auto mb-4 p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-indigo-600">Free Plan</span>
        <Zap size={14} className="text-amber-500 fill-amber-500" />
      </div>
      <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        {credits !== null ? credits : '-'}
        <span className="text-sm font-normal text-slate-400">/5</span>
      </div>
      <p className="text-xs text-slate-500 mt-1">Generations left</p>
      
      <button className="w-full mt-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
        Upgrade to Pro
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/30 backdrop-blur-xl fixed h-full z-20">
        <div className="p-6 flex items-center space-x-3">
          <img src="/favicon.png" alt="Kue Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Kue
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem page="chat" icon={MessageSquare} label="Chat Profiles" />
          <NavItem page="settings" icon={Settings} label="Settings" />
          <NavItem page="help" icon={HelpCircle} label="How to Use" />
        </nav>

        {/* Credits Display */}
        <CreditCounter />

        <div className="p-4 border-t border-border">
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src="/favicon.png" alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-lg">Kue</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-20 px-4 md:hidden flex flex-col">
           <nav className="space-y-2 flex-1">
            <NavItem page="chat" icon={MessageSquare} label="Chat Profiles" />
            <NavItem page="settings" icon={Settings} label="Settings" />
            <NavItem page="help" icon={HelpCircle} label="How to Use" />
          </nav>
          
          <div className="pb-8">
            <CreditCounter />
            <button onClick={handleLogout} className="flex items-center space-x-3 text-red-500 w-full px-4 py-3 border-t border-border mt-4">
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}