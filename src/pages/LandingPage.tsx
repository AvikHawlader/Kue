import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { MessageSquare, Zap, Shield, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-indigo-500/30">
      
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/favicon.png" alt="Kue Logo" className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight">Kue</span>
          </div>
          <div className="text-sm text-gray-400">v1.0 Public Beta</div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: The Pitch */}
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 fade-in">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              <Sparkles size={12} />
              <span>AI-Powered Dating Assistant</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Stop overthinking <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                your next text.
              </span>
            </h1>
            
            <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
              Kue is your AI Wingman. Upload a screenshot or paste a chat, and get 
              perfect, context-aware replies instantly. Charming, witty, or professional—you choose.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="p-2 bg-white/5 rounded-lg text-indigo-400">
                  <MessageSquare size={20} />
                </div>
                <span>Context Aware</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="p-2 bg-white/5 rounded-lg text-purple-400">
                  <Zap size={20} />
                </div>
                <span>Instant Replies</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="p-2 bg-white/5 rounded-lg text-pink-400">
                  <Shield size={20} />
                </div>
                <span>Private & Secure</span>
              </div>
            </div>
          </div>

          {/* Right Side: The Login Card */}
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            
            <div className="relative bg-[#121214] border border-white/10 p-8 rounded-2xl shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold">Get Started</h2>
                <p className="text-sm text-gray-500 mt-1">5 Free Generations included</p>
              </div>

              <Auth 
                supabaseClient={supabase} 
                appearance={{ 
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#6366f1', // Indigo-500
                        brandAccent: '#4f46e5',
                        brandButtonText: 'white',
                        defaultButtonBackground: '#1f1f22',
                        defaultButtonBackgroundHover: '#27272a',
                        inputBackground: '#1f1f22',
                        inputText: 'white',
                        inputBorder: '#3f3f46',
                      }
                    }
                  }
                }} 
                providers={['google']} 
                theme="dark"
              />
              
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  By signing in, you agree to our Terms and Privacy Policy.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
      
      {/* Footer / Social Proof */}
      <footer className="border-t border-white/5 py-12 bg-black/20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 mb-4">TRUSTED BY USERS FOR</p>
          <div className="flex justify-center gap-8 opacity-50 grayscale">
            <span className="font-bold text-xl">Hinge</span>
            <span className="font-bold text-xl">Tinder</span>
            <span className="font-bold text-xl">Bumble</span>
            <span className="font-bold text-xl">WhatsApp</span>
          </div>
        </div>
      </footer>
    </div>
  );
}