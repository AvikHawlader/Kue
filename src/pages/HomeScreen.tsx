import { useEffect, useState } from 'react';
import { Plus, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

interface HomeScreenProps {
  onAddProfile: () => void;
  onSelectProfile: (profile: any) => void;
}

export default function HomeScreen({ onAddProfile, onSelectProfile }: HomeScreenProps) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProfiles(data);
    } catch (error) {
      toast.error('Could not load profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, profileId: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this profile?")) return;
    
    setDeletingId(profileId);
    try {
      const { error } = await supabase.from('chat_profiles').delete().eq('id', profileId);
      if (error) throw error;
      
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      toast.success('Profile deleted');
    } catch (error) {
      toast.error('Failed to delete profile');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Title Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Chat Profiles</h1>
          <p className="text-slate-500 mt-1">Select a person to start generating replies.</p>
        </div>
        <button
          onClick={onAddProfile}
          className="hidden sm:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all shadow-sm"
        >
          <Plus size={20} />
          New Profile
        </button>
      </div>

      {/* Mobile Add Button (Visible only on small screens) */}
      <button
        onClick={onAddProfile}
        className="sm:hidden w-full py-3 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-medium shadow-sm"
      >
        <Plus size={20} className="mr-2" />
        New Profile
      </button>

      {/* Content Area */}
      <div>
        {isLoading ? (
          // Loading Skeletons
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse border border-slate-200"></div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          // Empty State (Polished)
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100">
              <MessageSquare className="text-slate-400 w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No profiles found</h3>
            <p className="text-slate-500 max-w-sm mt-2 mb-6">
              You haven't created any chat profiles yet. Add one to get started!
            </p>
            <button 
              onClick={onAddProfile}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Create Your First Profile
            </button>
          </div>
        ) : (
          // Profile Grid
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => onSelectProfile(profile)}
                className="group relative bg-white border border-slate-200 hover:border-indigo-300 p-5 rounded-xl hover:shadow-lg hover:shadow-indigo-100/50 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {profile.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                      {profile.relationship}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <MessageSquare size={20} />
                  </div>
                </div>

                {/* Delete Button (Top Right Absolute) */}
                <button
                  onClick={(e) => handleDelete(e, profile.id)}
                  disabled={deletingId === profile.id}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-full"
                  title="Delete Profile"
                >
                  {deletingId === profile.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}