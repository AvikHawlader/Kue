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
import LandingPage from './pages/LandingPage'; // <--- NEW IMPORT

// 1. Setup Query Client
const queryClient = new QueryClient();

// 2. Define Types for Navigation
type SidebarPage = 'chat' | 'settings' | 'help';
type ChatScreen = 'list' | 'add' | 'simulator';

function AppContent() {
  // Navigation State
  const [currentSidebarPage, setCurrentSidebarPage] = useState<SidebarPage>('chat');
  const [currentChatScreen, setCurrentChatScreen] = useState<ChatScreen>('list');
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  // --- NAVIGATION HELPERS ---
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
    >
      {/* 1. CHAT TAB (Contains your main app logic) */}
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
            />
          )}
        </div>
      )}

      {/* 2. SETTINGS TAB */}
      {currentSidebarPage === 'settings' && (
        <SettingsScreen />
      )}

      {/* 3. HELP TAB */}
      {currentSidebarPage === 'help' && (
        <HelpScreen />
      )}

      <Toaster />
    </AppLayout>
  );
}

// 4. The Wrapper (Handles Login/Auth)
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  // IF NOT LOGGED IN -> Show LANDING PAGE
  if (!session) {
    return <LandingPage />;
  }

  // IF LOGGED IN -> Show the App Content
  return (
    <QueryClientProvider client={queryClient}>
        <AppContent/>
    </QueryClientProvider>
  );
}