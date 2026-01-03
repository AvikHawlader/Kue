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

const queryClient = new QueryClient();

type SidebarPage = 'chat' | 'settings' | 'help';
type ChatScreen = 'list' | 'add' | 'simulator';

// --- AUTHENTICATED APP CONTENT ---
function AppContent({ session }: { session: any }) {
  const [currentSidebarPage, setCurrentSidebarPage] = useState<SidebarPage>('chat');
  const [currentChatScreen, setCurrentChatScreen] = useState<ChatScreen>('list');
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    // 1. Initial Fetch
    const fetchCredits = async () => {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        setCredits(data.credits_remaining);
      } else {
        // If row is missing, force create it (Self-healing)
        await supabase.rpc('handle_new_user'); 
        setCredits(5);
      }
    };

    fetchCredits();

    // 2. Real-time Subscription (The Magic Part)
    // This listens for changes in the database and updates the UI instantly
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

  return (
    <AppLayout 
      currentPage={currentSidebarPage} 
      onNavigate={setCurrentSidebarPage}
      credits={credits} 
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
              // We don't need onCreditsUsed anymore because Realtime handles it!
              onCreditsUsed={() => {}} 
            />
          )}
        </div>
      )}

      {currentSidebarPage === 'settings' && <SettingsScreen />}
      {currentSidebarPage === 'help' && <HelpScreen />}
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