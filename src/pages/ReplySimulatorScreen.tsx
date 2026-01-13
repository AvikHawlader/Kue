import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Copy, Check, BrainCircuit, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
// import { supabase } from '../lib/supabaseClient'; // No longer needed for generation
import KeyboardBar from '../components/KeyboardBar'; 

interface Profile {
  name: string;
  relationship: string;
  relationship_description?: string;
}

interface ReplySimulatorScreenProps {
  profile: Profile;
  onBack: () => void;
  onCreditsUsed: () => void;
  onTriggerPro: () => void;
}

const LOADING_STEPS = [
  "Reading message...",
  "Consulting Dossier...",
  "Querying ChromaDB...", // Visual feedback that we are using the DB
  "Drafting options...",
  "Refining tone..."
];

// --- HELPER: Map Profile to Python 'Category' ---
const getCategory = (relationship: string): string => {
  const r = relationship.toLowerCase();
  if (r.includes('boss') || r.includes('client') || r.includes('work') || r.includes('manager')) return 'Work';
  if (r.includes('date') || r.includes('girlfriend') || r.includes('boyfriend') || r.includes('crush') || r.includes('hinge')) return 'Dating';
  if (r.includes('mom') || r.includes('dad') || r.includes('family')) return 'Family';
  return 'Friends'; // Default
};

export default function ReplySimulatorScreen({ profile, onBack, onCreditsUsed, onTriggerPro }: ReplySimulatorScreenProps) {
  const [incomingMessage, setIncomingMessage] = useState('');
  const [replyType, setReplyType] = useState<string>('casual');
  const [customReplyType, setCustomReplyType] = useState('');
  const [replies, setReplies] = useState<string[]>([]);
  const [selectedReply, setSelectedReply] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lastPaidText, setLastPaidText] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Animation Loop
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

  const handleGenerate = async (isRegeneration: boolean) => {
    if (!incomingMessage.trim()) {
      toast.error('Please enter an incoming message');
      return;
    }

    setIsGenerating(true);
    
    if (!isRegeneration) {
      setReplies([]);
      setSelectedReply(null);
    }

    try {
      // 1. Prepare Data for Python Backend
      const category = getCategory(profile.relationship);
      
      // Determine 'custom_input'. 
      // If user chose a preset like "Flirty" (that isn't default), send it as custom instruction.
      let customInstruction = null;
      if (replyType === 'custom') {
         customInstruction = customReplyType;
      } else if (replyType !== 'casual') {
         // Pass presets like "Formal", "Witty" as instructions
         customInstruction = `Make it ${replyType}`;
      }

      if (isRegeneration) {
         customInstruction = customInstruction 
            ? `${customInstruction}. Give me 3 NEW variations.` 
            : "Give me 3 NEW variations.";
      }

      // 2. FETCH from RENDER
      const response = await fetch('https://kue-backend.onrender.com/mastermind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incoming_text: incomingMessage,
          dossier: {
            name: profile.name,
            category: category,
            role_title: profile.relationship,
            archetype: "Standard"
          },
          custom_input: customInstruction
        }),
      });

      if (!response.ok) {
        if (response.status === 402) throw new Error("OUT_OF_CREDITS"); // Handle if you add billing later
        throw new Error('Backend failed');
      }

      const data = await response.json();

      // 3. Transform Python Dict/Map to Array for React
      // Python sends: { "replies": { "positive": "...", "neutral": "..." } }
      // We need: ["...", "...", "..."]
      let replyArray: string[] = [];
      
      if (data.replies) {
         // Extract values from the dictionary object
         replyArray = Object.values(data.replies) as string[];
      }

      setReplies(replyArray);
      
      // Optional: Log the Analysis from Backend
      if (data.analysis) {
        console.log("AI Analysis:", data.analysis);
      }

      toast.success(isRegeneration ? 'Replies refreshed!' : 'Replies generated!');

      // 4. Handle Credits (Frontend Logic)
      if (!isRegeneration && incomingMessage !== lastPaidText) {
         onCreditsUsed();
         setLastPaidText(incomingMessage);
      }

    } catch (error: any) {
      console.error("Generation Error:", error);
      if (error.message.includes("OUT_OF_CREDITS")) {
         onTriggerPro();
      } else {
         toast.error("Could not connect to Brain. Check Render logs.");
      }
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

  // Button Logic
  const isTextEmpty = !incomingMessage.trim();
  const isPaidText = lastPaidText === incomingMessage;
  const canGenerate = !isTextEmpty && !isGenerating && !isPaidText;
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
            <textarea
              placeholder="Paste the message you received here..."
              value={incomingMessage}
              onChange={(e) => setIncomingMessage(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all placeholder:text-slate-400 text-slate-800"
            />
            
            <div className="grid grid-cols-1 gap-4">
               <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Vibe</label>
                  <select 
                     value={replyType} 
                     onChange={(e) => setReplyType(e.target.value)}
                     className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer hover:border-indigo-300"
                  >
                     <option value="casual">Casual & Chill (Default)</option>
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

      <KeyboardBar selectedReply={selectedReply} />
    </div>
  );
}