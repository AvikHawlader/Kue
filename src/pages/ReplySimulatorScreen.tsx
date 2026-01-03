import { useState } from 'react';
import { ArrowLeft, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import KeyboardBar from '../components/KeyboardBar';

interface ReplySimulatorScreenProps {
  profile: any;
  onBack: () => void;
}

export default function ReplySimulatorScreen({ profile, onBack }: ReplySimulatorScreenProps) {
  const [incomingMessage, setIncomingMessage] = useState('');
  const [replyType, setReplyType] = useState<string>('casual');
  const [customReplyType, setCustomReplyType] = useState('');
  const [replies, setReplies] = useState<string[]>([]);
  const [selectedReply, setSelectedReply] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!incomingMessage.trim()) {
      toast.error('Please enter an incoming message');
      return;
    }

    setIsGenerating(true);
    setReplies([]);

    try {
       const effectiveReplyType = replyType === 'custom' ? customReplyType : replyType;
       
       // CALL SUPABASE AI FUNCTION
       const { data, error } = await supabase.functions.invoke('generate-reply', {
        body: { 
          message: incomingMessage, 
          profile: profile, 
          replyType: effectiveReplyType 
        }
      });

      if (error) throw error;
      
      if (data?.replies) {
        setReplies(data.replies);
        toast.success('Replies generated!');
      }

    } catch (error) {
      console.error(error);
      toast.error("AI is offline. Using backup.");
      // Fallback
      setTimeout(() => {
        setReplies(["Can't talk right now.", "Sounds good!", "Let me check."]);
        setIsGenerating(false);
      }, 1000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (reply: string, index: number) => {
    navigator.clipboard.writeText(reply);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-indigo-50/20 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium hover:text-indigo-600">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="text-right">
              <div className="font-semibold text-slate-900">{profile.name}</div>
              <div className="text-xs text-slate-500 line-clamp-1">
                {profile.relationship_description || profile.relationship}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Incoming Message */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold">Incoming Message</h3>
            <p className="text-sm text-slate-500">Enter the message you received</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <textarea
                placeholder="e.g., Hey! Are you free for coffee tomorrow?"
                value={incomingMessage}
                onChange={(e) => setIncomingMessage(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Reply Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Reply Type</label>
              <select 
                value={replyType} 
                onChange={(e) => setReplyType(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Custom Input */}
            {replyType === 'custom' && (
              <div className="space-y-2">
                <input
                  placeholder="e.g. Humorous and lighthearted"
                  value={customReplyType}
                  onChange={(e) => setCustomReplyType(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !incomingMessage.trim()}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Smart Replies
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Replies */}
        {replies.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 overflow-hidden">
             <div className="p-4 border-b border-indigo-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                     <Sparkles className="w-4 h-4 text-white" />
                   </div>
                   <span className="font-semibold text-indigo-900">AI Replies</span>
                </div>
             </div>
             <div className="p-4 space-y-3">
                {replies.map((reply, index) => (
                   <div
                    key={index}
                    onClick={() => setSelectedReply(reply)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md relative ${
                        selectedReply === reply ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
                    }`}
                   >
                     <p className="text-sm text-slate-800 pr-8">{reply}</p>
                     <button 
                        onClick={(e) => { e.stopPropagation(); handleCopy(reply, index); }}
                        className="absolute top-3 right-3 p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-600"
                     >
                        {copiedIndex === index ? <Check className="w-4 h-4 text-green-500"/> : <Copy className="w-4 h-4"/>}
                     </button>
                   </div>
                ))}
             </div>
          </div>
        )}
      </main>

      <KeyboardBar selectedReply={selectedReply} />
    </div>
  );
}