import React, { useState } from 'react';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

interface AddProfileScreenProps {
  onBack: () => void;
  onProfileCreated: () => void;
}

export default function AddProfileScreen({ onBack, onProfileCreated }: AddProfileScreenProps) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !relationship.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Get Current User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      let publicUrl = null;

      // 2. Upload Image (If exists)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat_screenshots')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl: url } } = supabase.storage
          .from('chat_screenshots')
          .getPublicUrl(filePath);
        
        publicUrl = url;
      }

      // 3. Save Profile to Database
      const finalRelationship = publicUrl 
        ? `${relationship}\n\n[SCREENSHOT_URL: ${publicUrl}]`
        : relationship;

      const { error: dbError } = await supabase
        .from('chat_profiles')
        .insert({
          user_id: user.id,
          name,
          relationship: finalRelationship
        });

      if (dbError) throw dbError;

      toast.success('Profile created successfully!');
      
      // 4. Navigate Back
      onProfileCreated(); 

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-secondary rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Chat Profile</h1>
          <p className="text-muted-foreground">Add someone you want to generate replies for.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border p-6 rounded-xl shadow-sm">
        
        {/* Contact Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="e.g. Sarah, Boss, Landlord"
          />
        </div>

        {/* Relationship / Context */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            Relationship & Context <span className="text-red-500">*</span>
          </label>
          <textarea
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Describe who they are and the current situation..."
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            Upload Chat Screenshot (Optional)
          </label>
          
          {!previewUrl ? (
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 hover:bg-secondary/50 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:text-primary/90"
                  >
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageSelect} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">PNG, JPG up to 5MB</p>
              </div>
            </div>
          ) : (
            <div className="relative mt-2 rounded-lg overflow-hidden border border-border">
              <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover opacity-75" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Profile'
            )}
          </button>
        </div>

      </form>
    </div>
  );
}