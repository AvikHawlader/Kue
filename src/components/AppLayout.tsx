import React, { useState } from 'react';
import { MessageSquare, Settings, LogOut, Menu, X, HelpCircle, Zap } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Helper to load Razorpay script
function loadRazorpayScript(src: string) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: 'chat' | 'settings' | 'help';
  onNavigate: (page: 'chat' | 'settings' | 'help') => void;
  credits: number | null;
}

export default function AppLayout({ children, currentPage, onNavigate, credits }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handlePayment = async () => {
    // 1. Load Razorpay SDK
    const res = await loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    // 2. Get current user info for pre-fill
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return;

    // 3. Create Order on Backend
    const { data: orderData, error } = await supabase.functions.invoke('razorpay-order', {
      body: { plan: 'pro' }
    });

    if (error) {
      console.error(error);
      alert("Server error. Please try again.");
      return;
    }

    // 4. Open Razorpay Options
    const options = {
      key: "rzp_test_RzMK7npP45C2pl", // YOUR ACTUAL KEY
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Kue App",
      description: "Upgrade to Pro Plan",
      image: "/favicon.png",
      order_id: orderData.id,
      handler: function (response: any) {
        alert("Payment Successful! Your account is being upgraded.");
        window.location.reload(); 
      },
      prefill: {
        email: user.email,
        contact: "" 
      },
      theme: {
        color: "#4f46e5"
      }
    };

    // @ts-ignore
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
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
        <span className="text-xs font-semibold text-indigo-600">Free Plan</span>
        <Zap size={14} className="text-amber-500 fill-amber-500" />
      </div>
      <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        {credits !== null ? credits : '-'}
        <span className="text-sm font-normal text-slate-400">/5</span>
      </div>
      <p className="text-xs text-slate-500 mt-1">Generations left</p>
      
      <button 
        onClick={handlePayment}
        className="w-full mt-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
      >
        Upgrade to Pro (₹199)
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
      {/* FIXED: Added 'bg-white' and 'z-50' to force solid background on top */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white pt-20 px-4 md:hidden flex flex-col animate-in fade-in duration-200">
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
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}