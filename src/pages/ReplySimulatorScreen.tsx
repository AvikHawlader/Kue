import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Copy, Check, BrainCircuit, RotateCcw, ShieldAlert, FileSearch } from 'lucide-react';
import { toast } from 'sonner';
import KeyboardBar from '../components/KeyboardBar'; 

interface ReplySimulatorScreenProps {
  profile: any;
  onBack: () => void;
  onCreditsUsed: () => void;
  onTriggerPro: () => void;
}

const LOADING_STEPS = [
  "Consulting the Mastermind...",
  "Analyzing relationship dynamics...",
  "Decoding subtext...",
  "Drafting strategic options...",
  "Polishing tone..."
];

export default function ReplySimulatorScreen({ profile, onBack, onCreditsUsed, onTriggerPro }: ReplySimulatorScreenProps) {
  const [incomingMessage, setIncomingMessage] = useState('');
  const [replyType, setReplyType] = useState<string>('casual');
  const [customReplyType, setCustomReplyType] = useState('');
  
  // Data State
  const [replies, setReplies] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<any>(null); // New: Store Python Analysis
  
  const [selectedReply, setSelectedReply] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lastPaidText, setLastPaidText] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Cycle Loading Text
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

  // --- HELPER: Map Profile to Python Dossier ---
  const getCategoryFromRelationship = (rel: string) => {
    const r = rel.toLowerCase();
    if (r.includes('boss') || r.includes('manager') || r.includes('client') || r.includes('work')) return 'Work';
    if (r.includes('date') || r.includes('tinder') || r.includes('hinge') || r.includes('gf') || r.includes('bf')) return 'Dating';
    if (r.includes('mom') || r.includes('dad') || r.includes('family')) return 'Family';
    return 'Friends'; // Default
  };

  const handleGenerate = async (isRegeneration: boolean) => {
    if (!incomingMessage.trim()) {
      toast.error('Please enter an incoming message');
      return;
    }

    setIsGenerating(true);
    
    // Clear old data only if it's a fresh generation
    if (!isRegeneration) {
      setReplies([]);
      setAnalysis(null);
      setSelectedReply(null);
    }

    try {
       // 1. Prepare Data for Python
       const effectiveReplyType = replyType === 'custom' ? customReplyType : replyType;
       
       // If user picked a specific vibe (e.g. Flirty) or is Regenerating, send as custom_input
       // Otherwise, send null to let the Python "Triad" system work (Pos/Neu/Neg)
       let customInput = null;
       
       if (isRegeneration) {
          customInput = `Regenerate completely new options. Variation ID: ${Date.now()}. Previous Vibe: ${effectiveReplyType}`;
       } else if (replyType !== 'casual') { 
          // If 'casual' (default), we let the Category drive the persona. 
          // If 'flirty'/'formal'/custom, we force it via custom_input
          customInput = `Generate replies with a ${effectiveReplyType} tone.`;
       }

       const payload = {
         incoming_text: incomingMessage,
         dossier: {
           name: profile.name,
           category: getCategoryFromRelationship(profile.relationship),
           role_title: profile.relationship,
           archetype: "Standard" 
         },
         custom_input: customInput
       };

       // 2. Call the Render Python API
       const response = await fetch('https://kue-backend.onrender.com/mastermind', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
       });

       if (!response.ok) {
         throw new Error(`Server Error: ${response.status}`);
       }

       const data = await response.json();

       // 3. Process Python Output
       // Python returns { analysis: {...}, replies: { option_1: "...", ... } }
       if (data && data.replies) {
          // Convert the Dictionary of replies (Values) into an Array
          const replyList = Object.values(data.replies) as string[];
          setReplies(replyList);
          setAnalysis(data.analysis); // Save the analysis block
          
          toast.success(isRegeneration ? 'Strategies refreshed!' : 'Analysis complete!');
          
          // Credit Logic (Frontend Side)
          if (!isRegeneration && incomingMessage !== lastPaidText) {
             onCreditsUsed(); 
             setLastPaidText(incomingMessage);
          }
       }

    } catch (error: any) {
      console.error("Mastermind Error:", error);
      toast.error("Connecting to Mastermind..."); // Friendly error for cold starts
      
      // Optional: Retry logic could go here if Render is waking up
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

  const isTextEmpty = !incomingMessage.trim();
  const isPaidText = lastPaidText === incomingMessage;
  const canGenerate = !isTextEmpty && !isGenerating && !isPaidText;
  const canRegenerate = !isTextEmpty && !isGenerating && isPaidText;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-indigo-50/20 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
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
        
        {/* INPUT BOX */}
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
                  <label className="text-xs font-semibold text-slate-500 uppercase">Strategy / Vibe</label>
                  <select 
                     value={replyType} 
                     onChange={(e) => setReplyType(e.target.value)}
                     className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer hover:border-indigo-300"
                  >
                     <option value="casual">Default Strategy (Auto)</option>
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
                      {LOADING_STEPS[loadingStep] || "Consulting..."}
                    </span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Strategy</span>
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
            
            <p className="text-center text-xs text-slate-400">
              Costs 1 Credit per new message • <span className="text-indigo-500 font-medium">Free Regenerations</span>
            </p>
          </div>
        </div>

        {/* RESULTS SECTION */}
        {replies.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
             
             {/* NEW: ANALYSIS BOX */}
             {analysis && (
               <div className="bg-indigo-900 rounded-xl p-4 shadow-lg text-white border border-indigo-700">
                 <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-800 rounded-lg">
                      <FileSearch size={20} className="text-indigo-300" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-indigo-200 uppercase tracking-wider mb-1">
                        Subtext Analysis
                      </h4>
                      <p className="text-sm font-medium leading-relaxed mb-2">
                        "{analysis.translation}"
                      </p>
                      
                      <div className="flex items-center gap-3 mt-3">
                         <div className="px-2 py-1 bg-indigo-800 rounded text-xs text-indigo-200 flex items-center gap-1">
                           <ShieldAlert size={12} />
                           Threat: {analysis.threat_level}%
                         </div>
                         <div className="text-xs text-indigo-300 italic truncate max-w-[200px]">
                           Tip: {analysis.strategy_advice}
                         </div>
                      </div>
                    </div>
                 </div>
               </div>
             )}

             {/* REPLIES LIST */}
             <div className="bg-white rounded-xl border border-indigo-100 shadow-xl shadow-indigo-100/50 overflow-hidden">
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
          </div>
        )}
      </main>

      {KeyboardBar && <KeyboardBar selectedReply={selectedReply} />}
    </div>
  );
}