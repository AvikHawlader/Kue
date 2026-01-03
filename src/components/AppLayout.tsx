import React, { useState } from 'react';
import { MessageSquare, Settings, LogOut, Menu, X, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: 'chat' | 'settings' | 'help';
  onNavigate: (page: 'chat' | 'settings' | 'help') => void;
}

export default function AppLayout({ children, currentPage, onNavigate }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/30 backdrop-blur-xl fixed h-full">
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
        <div className="fixed inset-0 z-40 bg-background pt-20 px-4 md:hidden">
           <nav className="space-y-2">
            <NavItem page="chat" icon={MessageSquare} label="Chat Profiles" />
            <NavItem page="settings" icon={Settings} label="Settings" />
            <NavItem page="help" icon={HelpCircle} label="How to Use" />
            <div className="pt-8">
              <button onClick={handleLogout} className="flex items-center space-x-3 text-red-500 w-full px-4 py-3">
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
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