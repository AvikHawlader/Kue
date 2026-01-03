import { X, Check, Zap, Keyboard } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Reuse the Razorpay loader
function loadRazorpayScript(src: string) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function ProUpgradeModal({ isOpen, onClose }: ProUpgradeModalProps) {
  if (!isOpen) return null;

  const handlePayment = async () => {
    // 1. Load the Script
    const res = await loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return;

    // 2. Create Order on Backend
    const { data: orderData, error } = await supabase.functions.invoke('razorpay-order', {
      body: { plan: 'pro' }
    });

    if (error) {
      console.error("Order Creation Error:", error);
      alert("Could not start payment. Please try again.");
      return;
    }

    // 3. Open Payment Options
    const options = {
      key: "rzp_test_RzMK7npP45C2pl", // YOUR ACTUAL KEY
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Kue Pro",
      description: "Upgrade to Unlimited",
      image: "/favicon.png",
      order_id: orderData.id,
      // FIX: Renamed 'response' to '_response' to satisfy Vercel
      handler: function (_response: any) {
        alert("Welcome to Pro! Your credits are being updated.");
        window.location.reload();
      },
      prefill: { email: user.email },
      theme: { color: "#4f46e5" }
    };

    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header Image/Gradient */}
        <div className="h-32 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="text-center">
             <div className="w-12 h-12 bg-white rounded-xl mx-auto flex items-center justify-center text-indigo-600 shadow-lg mb-2">
               <Zap fill="currentColor" size={24} />
             </div>
             <h2 className="text-white font-bold text-xl">Unlock Unlimited Rizz</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900">You're out of free credits!</h3>
            <p className="text-sm text-slate-500 mt-1">Join the Pro members getting 3x more dates.</p>
          </div>

          {/* Benefits List */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <BenefitItem text="Unlimited AI Replies" />
            <BenefitItem text="Custom Vibes (Pirate, Sarcastic, etc.)" />
            <BenefitItem text="Priority Processing Speed" />
            <BenefitItem 
              text="Magic Keyboard Switch (Coming Soon!)" 
              icon={<Keyboard size={16} className="text-indigo-500" />} 
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handlePayment}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Get Pro for ₹199/mo
          </button>

          <p className="text-center text-xs text-slate-400">
            Secure payment via Razorpay • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}

function BenefitItem({ text, icon }: { text: string, icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 min-w-[20px]">
        {icon || <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Check size={12} strokeWidth={3} /></div>}
      </div>
      <span className="text-sm text-slate-700 font-medium leading-tight">{text}</span>
    </div>
  );
}