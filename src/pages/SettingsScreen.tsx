import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SettingsScreen() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email || 'No email found');
    });
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences.</p>
      </div>

      <div className="grid gap-6">
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Account</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email Address</label>
              <div className="mt-1 p-3 bg-secondary/50 rounded-md border border-border text-foreground">
                {email}
              </div>
            </div>
            <div className="pt-2">
               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                 Free Plan Active
               </span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
          <h3 className="text-lg font-semibold mb-4">App Preferences</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reply Tone</p>
              <p className="text-sm text-muted-foreground">Default tone for new chats</p>
            </div>
            <select className="p-2 rounded-md border border-border bg-background">
              <option>Casual</option>
              <option>Professional</option>
              <option>Flirty</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}