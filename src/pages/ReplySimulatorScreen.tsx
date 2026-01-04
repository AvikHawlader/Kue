import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Copy, Check, BrainCircuit, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import KeyboardBar from '../components/KeyboardBar'; 

interface ReplySimulatorScreenProps {
  profile: any;
  onBack: () => void;
  onCreditsUsed: () => void;
  onTriggerPro: () => void;
}

const LOADING_STEPS = [
  "Reading message...",
  "Understanding context...",
  "Drafting options...",
  "Refining tone...",
  "Finalizing..."
];

export default function ReplySimulatorScreen({ profile, onBack, onCreditsUsed, onTriggerPro }: ReplySimulatorScreenProps) {
  const [incomingMessage, setIncomingMessage] = useState('');
  const [replyType, setReplyType] = useState<string>('casual');
  const [customReplyType, setCustomReplyType] = useState('');
  const [replies, setReplies] = useState<string[]>([]);
  const [selectedReply, setSelectedReply] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Track exactly what text the user has paid for
  const [lastPaidText, setLastPaidText] = useState<string | null>(null);
  
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Unified Handler
  const handleGenerate = async (isRegeneration: boolean) => {
    if (!incomingMessage.trim()) {
      toast.error('Please enter an incoming message');
      return;
    }

    setIsGenerating(true);
    
    // UI Feedback: If generating new (paid), clear list. 
    // If regenerating (free), keep list but dim it
    if (!isRegeneration) {
      setReplies([]);
      setSelectedReply(null);
    }

    try {
       const effectiveReplyType = replyType === 'custom' ? customReplyType : replyType;
       
       // Inject randomizer to force fresh replies on regen
       const aiInstruction = isRegeneration 
         ? `${effectiveReplyType}. (Variation ID: ${Date.now()}) IMPORTANT: Write 3 completely new and different options than before.` 
         : effectiveReplyType;
       
       const { data, error } = await supabase.functions.invoke('generate-reply', {
        body: { 
          message: incomingMessage, 
          profile: profile, 
          replyType: aiInstruction,
          // ⚠️ CRITICAL FIX: SEND THIS FLAG TO BACKEND ⚠️
          isRegeneration: isRegeneration 
        }
      });

      if (error) throw error;
      
      if (data?.replies) {
        setReplies(data.replies);
        toast.success(isRegeneration ? 'Replies refreshed!' : 'Replies generated!');
        
        // --- HARD SAFETY LATCH ---
        
        // CASE 1: REGENERATION (Right Button)
        if (isRegeneration) {
           // Do absolutely nothing regarding credits.
           // It is free. Stop here.
        } 
        // CASE 2: NEW GENERATION (Left Button)
        else {
           // Double check: Is this actually new text?
           if (incomingMessage !== lastPaidText) {
             onCreditsUsed(); // Deduct Credit on Frontend
             setLastPaidText(incomingMessage); // Mark as paid
           }
        }
      }

    } catch (error: any) {
      const isOutOfCredits = 
        error.context?.status === 402 || 
        (error.message && error.message.includes("402")) ||
        (error.message && error.message.includes("OUT_OF_CREDITS"));

      if (isOutOfCredits) {
        onTriggerPro(); 
        setIsGenerating(false);
        return;
      }

      console.error("Generation Error:", error);
      toast.error("Something went wrong. Please try again.");
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

  // --- BUTTON STATE LOGIC ---
  const isTextEmpty = !incomingMessage.trim();
  
  // Logic: "Have I paid for this specific sentence yet?"
  const isPaidText = lastPaidText === incomingMessage;
  
  // Main Button (Generate): Active ONLY if I haven't paid for this text yet
  const canGenerate = !isTextEmpty && !isGenerating && !isPaidText;
  
  // Regen Button (Refresh): Active ONLY if I HAVE paid for this text already
  const canRegenerate = !isTextEmpty && !isGenerating && isPaidText;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-indigo-50/20 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBack} 
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="text-right">
              <div className="font-semibold text-slate-900">{profile.name}</div>
              <div className="text-xs text-slate-500 max-w-[150px] truncate">
                {profile.relationship_description || profile.relationship}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Incoming Message</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <textarea
                placeholder="Paste the message you received here..."
                value={incomingMessage}
                onChange={(e) => setIncomingMessage(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
               <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Vibe</label>
                  <select 
                     value={replyType} 
                     onChange={(e) => setReplyType(e.target.value)}
                     className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer hover:border-indigo-300"
                  >
                     <option value="casual">Casual & Chill</option>
                     <option value="flirty">Flirty & Fun</option>
                     <option value="formal">Professional</option>
                     <option value="witty">Witty & Smart</option>
                     <option value="custom">✨ Custom...</option>
                  </select>
               </div>
               {replyType === 'custom' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                     <label className="text-xs font-semibold text-slate-500 uppercase">Custom Vibe</label>
                     <input
                        placeholder="e.g. Like a pirate, Sarcastic..."
                        value={customReplyType}
                        onChange={(e) => setCustomReplyType(e.target.value)}
                        className="w-full h-11 px-3 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-indigo-50/30"
                     />
                  </div>
               )}
            </div>
            
            <div className="flex gap-3">
              {/* Button 1: Main Generate (COSTS CREDIT) */}
              <button
                onClick={() => handleGenerate(false)}
                disabled={!canGenerate}
                className={`flex-1 h-12 rounded-xl font-medium shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] overflow-hidden relative ${
                  canGenerate 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200/50' 
                    : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                }`}
              >
                {isGenerating && !canRegenerate ? (
                  <div className="flex items-center gap-2 animate-in fade-in duration-300">
                    <BrainCircuit className="w-5 h-5 animate-pulse" />
                    <span className="min-w-[140px] text-left">
                      {LOADING_STEPS[loadingStep] || "Thinking..."}
                    </span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Replies</span>
                  </>
                )}
              </button>

              {/* Button 2: Regenerate (FREE) */}
              <button
                onClick={() => handleGenerate(true)}
                disabled={!canRegenerate}
                title={canRegenerate ? "Try again with current vibe (Free)" : "Enter text first"}
                className={`w-14 h-12 rounded-xl flex items-center justify-center transition-all border-2 ${
                  canRegenerate
                    ? 'border-indigo-600 text-indigo-600 bg-white hover:bg-indigo-50 shadow-md cursor-pointer active:scale-95'
                    : 'border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed'
                }`}
              >
                 <RotateCcw className={`w-5 h-5 ${isGenerating && canRegenerate ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <p className="text-center text-xs text-slate-400">
              Costs 1 Credit per new message • <span className="text-indigo-500 font-medium">Free Regenerations</span>
            </p>
          </div>
        </div>

        {replies.length > 0 && (
          <div className="bg-white rounded-xl border border-indigo-100 shadow-xl shadow-indigo-100/50 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="p-3 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
                     <Sparkles className="w-3 h-3 text-white" />
                   </div>
                   <span className="font-semibold text-indigo-900 text-sm">Suggested Replies</span>
                </div>
             </div>
             
             <div className="p-4 space-y-3">
                {replies.map((reply, index) => (
                   <div
                    key={index}
                    onClick={() => setSelectedReply(reply)}
                    className={`group p-4 rounded-xl border cursor-pointer transition-all duration-200 relative ${
                        selectedReply === reply 
                           ? 'border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-500' 
                           : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm'
                    }`}
                   >
                     <p className="text-base text-slate-700 pr-8 leading-relaxed">{reply}</p>
                     <button 
                        onClick={(e) => { e.stopPropagation(); handleCopy(reply, index); }}
                        className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${
                           copiedIndex === index 
                              ? 'bg-green-100 text-green-600' 
                              : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                        title="Copy to clipboard"
                     >
                        {copiedIndex === index ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                     </button>
                   </div>
                ))}
             </div>
          </div>
        )}
      </main>

      {KeyboardBar && <KeyboardBar selectedReply={selectedReply} />}
    </div>
  );
}