import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { supabase } from './lib/supabaseClient';

// Layout & Pages
import AppLayout from './components/AppLayout';
import HomeScreen from './pages/HomeScreen';
import AddProfileScreen from './pages/AddProfileScreen';
import ReplySimulatorScreen from './pages/ReplySimulatorScreen';
import SettingsScreen from './pages/SettingsScreen';
import HelpScreen from './pages/HelpScreen';
import LandingPage from './pages/LandingPage';
import ProUpgradeModal from './components/ProUpgradeModal';

// NEW: Import Legal Pages
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

const queryClient = new QueryClient();

// Updated Types to include legal pages
type SidebarPage = 'chat' | 'settings' | 'help' | 'privacy' | 'terms';
type ChatScreen = 'list' | 'add' | 'simulator';

// --- AUTHENTICATED APP CONTENT ---
function AppContent({ session }: { session: any }) {
  const [currentSidebarPage, setCurrentSidebarPage] = useState<SidebarPage>('chat');
  const [currentChatScreen, setCurrentChatScreen] = useState<ChatScreen>('list');
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  
  // Global State
  const [credits, setCredits] = useState<number | null>(null);
  const [nextRefill, setNextRefill] = useState<string | null>(null);
  const [isProModalOpen, setIsProModalOpen] = useState(false); // Global Modal State

  const fetchCredits = async () => {
    // Call the smart DB function
    const { data } = await supabase
      .rpc('check_and_refill_credits', { user_uuid: session.user.id });

    if (data && data.length > 0) {
      setCredits(data[0].new_credits);
      setNextRefill(data[0].next_refill);
    } else {
      // Self-healing for new users
      await supabase.rpc('handle_new_user'); 
      setCredits(5);
      // Set fake next refill for UI consistency
      setNextRefill(new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString());
    }
  };

  useEffect(() => {
    if (!session?.user) return;

    fetchCredits();

    // Real-time Subscription (Source of Truth)
    const channel = supabase
      .channel('realtime-credits')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          setCredits(payload.new.credits_remaining);
          // If credits jump back to 5 (refill happened), re-fetch to get new refill time
          if (payload.new.credits_remaining === 5) fetchCredits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleNavigateToHome = () => {
    setCurrentChatScreen('list');
    setSelectedProfile(null);
  };

  const handleNavigateToAdd = () => {
    setCurrentChatScreen('add');
  };

  const handleSelectProfile = (profile: any) => {
    setSelectedProfile(profile);
    setCurrentChatScreen('simulator');
  };

  // FIX: Optimistic Update function.
  const handleCreditsUsedOptimistically = () => {
    setCredits((prev) => (prev && prev > 0 ? prev - 1 : 0));
  };

  // --- ROUTING LOGIC FOR LEGAL PAGES ---
  // Return early to render full page
  
  if (currentSidebarPage === 'privacy') {
    return <PrivacyPolicy onBack={() => setCurrentSidebarPage('settings')} />;
  }

  if (currentSidebarPage === 'terms') {
    return <TermsOfService onBack={() => setCurrentSidebarPage('settings')} />;
  }

  return (
    <AppLayout 
      currentPage={currentSidebarPage} 
      onNavigate={setCurrentSidebarPage}
      credits={credits} 
      nextRefill={nextRefill} // Pass down
      onTriggerPro={() => setIsProModalOpen(true)} // Pass trigger down
    >
      {currentSidebarPage === 'chat' && (
        <div className="animate-in fade-in duration-300">
          {currentChatScreen === 'list' && (
            <HomeScreen
              onAddProfile={handleNavigateToAdd}
              onSelectProfile={handleSelectProfile}
            />
          )}
          
          {currentChatScreen === 'add' && (
            <AddProfileScreen 
              onBack={handleNavigateToHome} 
              onProfileCreated={handleNavigateToHome}
            />
          )}
          
          {currentChatScreen === 'simulator' && selectedProfile && (
            <ReplySimulatorScreen 
              profile={selectedProfile} 
              onBack={handleNavigateToHome} 
              // FIX: Pass the optimistic handler instead of an empty function
              onCreditsUsed={handleCreditsUsedOptimistically} 
              onTriggerPro={() => setIsProModalOpen(true)} // Trigger from Error
            />
          )}
        </div>
      )}

      {currentSidebarPage === 'settings' && <SettingsScreen />}
      {currentSidebarPage === 'help' && <HelpScreen />}
      
      {/* Global Modal */}
      <ProUpgradeModal 
        isOpen={isProModalOpen} 
        onClose={() => setIsProModalOpen(false)} 
      />
      
      <Toaster />
    </AppLayout>
  );
}

// --- MAIN WRAPPER ---
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  if (!session) {
    return <LandingPage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
        <AppContent session={session} />
    </QueryClientProvider>
  );
}