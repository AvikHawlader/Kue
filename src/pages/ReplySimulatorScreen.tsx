import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Copy, Check, RotateCcw, ScanEye } from 'lucide-react';
import { toast } from 'sonner';
import KeyboardBar from '../components/KeyboardBar'; 

// --- TYPES ---
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

interface AnalysisData {
  translation: string;
  threat_level: number;
  strategy_advice: string;
}

const LOADING_STEPS = [
  "Reading message...",
  "Consulting Dossier...",
  "Searching Memory (ChromaDB)...", 
  "Analyzing Threat Level...",
  "Drafting replies..."
];

// --- LOGIC: Context Mapping ---
const getCategory = (relationship: string): 'Work' | 'Dating' | 'Friends' | 'Family' => {
  const r = relationship.toLowerCase();
  if (r.includes('boss') || r.includes('client') || r.includes('work') || r.includes('manager')) return 'Work';
  if (r.includes('date') || r.includes('girlfriend') || r.includes('boyfriend') || r.includes('crush') || r.includes('hinge')) return 'Dating';
  if (r.includes('mom') || r.includes('dad') || r.includes('family')) return 'Family';
  return 'Friends'; 
};

export default function ReplySimulatorScreen({ profile, onBack, onCreditsUsed, onTriggerPro }: ReplySimulatorScreenProps) {
  const [incomingMessage, setIncomingMessage] = useState('');
  
  // SLIDERS STATE
  const [slider1, setSlider1] = useState(50); // Interest / Professionalism
  const [slider2, setSlider2] = useState(20); // Spice / Assertiveness
  
  // FIXED: Now we use this state in the UI below
  const [customRequest, setCustomRequest] = useState('');
  
  // OUTPUT STATE
  const [replies, setReplies] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  
  const [selectedReply, setSelectedReply] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lastPaidText, setLastPaidText] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Derived Values
  const category = getCategory(profile.relationship);
  
  // Dynamic Labels based on Category
  const slider1Label = category === 'Work' ? 'Professionalism' : 'Interest';
  const slider2Label = category === 'Work' ? 'Assertiveness' : (category === 'Dating' ? 'Spice 🌶️' : 'Roast Level');

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
    setAnalysis(null); 
    
    if (!isRegeneration) {
      setReplies([]);
      setSelectedReply(null);
    }

    try {
      const response = await fetch('https://kue-backend.onrender.com/mastermind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incoming_text: incomingMessage,
          dossier: {
            name: profile.name,
            category: category,
            role_title: profile.relationship,
            archetype: "Standard"
          },
          interest_score: slider1,
          spice_score: slider2,
          custom_input: customRequest || null
        }),
      });

      if (!response.ok) {
        if (response.status === 402) throw new Error("OUT_OF_CREDITS"); 
        throw new Error('Backend failed');
      }

      const data = await response.json();

      let replyArray: string[] = [];
      if (data.replies) replyArray = Object.values(data.replies) as string[];
      setReplies(replyArray);

      if (data.analysis) {
        setAnalysis(data.analysis);
      }

      toast.success(isRegeneration ? 'Refreshed!' : 'Decoded & Generated!');

      if (!isRegeneration && incomingMessage !== lastPaidText) {
         onCreditsUsed();
         setLastPaidText(incomingMessage);
      }

    } catch (error: any) {
      console.error("Generation Error:", error);
      if (error.message.includes("OUT_OF_CREDITS")) {
         onTriggerPro();
      } else {
         toast.error("Connection failed. Check Render.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (reply: string, index: number) => {
    navigator.clipboard.writeText(reply);
    setCopiedIndex(index);
    toast.success('Copied');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isTextEmpty = !incomingMessage.trim();
  const isPaidText = lastPaidText === incomingMessage;
  const canGenerate = !isTextEmpty && !isGenerating && !isPaidText;
  const canRegenerate = !isTextEmpty && !isGenerating && isPaidText;

  const getThreatColor = (level: number) => {
    if (level < 30) return 'text-green-600 bg-green-50 border-green-200';
    if (level < 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-indigo-50/20 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-right">
            <div className="font-semibold text-slate-900">{profile.name}</div>
            <div className="text-xs text-slate-500">{category} Mode</div>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* INPUT CARD */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
            <textarea
              placeholder="Paste the message here..."
              value={incomingMessage}
              onChange={(e) => setIncomingMessage(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none text-slate-800"
            />
            
            {/* SLIDERS SECTION */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                 <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase">
                    <span>{slider1Label}</span>
                    <span>{slider1}%</span>
                 </div>
                 <input 
                   type="range" min="0" max="100" 
                   value={slider1} onChange={(e) => setSlider1(Number(e.target.value))}
                   className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                 />
              </div>

              <div className="space-y-1">
                 <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase">
                    <span>{slider2Label}</span>
                    <span>{slider2}%</span>
                 </div>
                 <input 
                   type="range" min="0" max="100" 
                   value={slider2} onChange={(e) => setSlider2(Number(e.target.value))}
                   className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                 />
              </div>
              
              {/* FIXED: ADDED CUSTOM INPUT FIELD HERE */}
              <div className="space-y-1 pt-2">
                 <label className="text-xs font-semibold text-slate-500 uppercase">Custom Context (Optional)</label>
                 <input 
                    placeholder="e.g. Mention we met at the gym..."
                    value={customRequest} 
                    onChange={(e) => setCustomRequest(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-slate-50"
                 />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleGenerate(false)}
                disabled={!canGenerate}
                className={`flex-1 h-12 rounded-xl font-medium shadow-lg flex items-center justify-center gap-2 transition-all ${
                  canGenerate ? 'bg-indigo-600 text-white shadow-indigo-200/50 hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isGenerating && !canRegenerate ? (
                   <span className="text-sm">{LOADING_STEPS[loadingStep]}</span>
                ) : (
                   <> <Sparkles className="w-4 h-4" /> <span>Decode & Reply</span> </>
                )}
              </button>

              <button
                onClick={() => handleGenerate(true)}
                disabled={!canRegenerate}
                className={`w-14 h-12 rounded-xl flex items-center justify-center border-2 ${
                  canRegenerate ? 'border-indigo-600 text-indigo-600' : 'border-slate-200 text-slate-300'
                }`}
              >
                 <RotateCcw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>
        </div>

        {/* THE DECODER CARD */}
        {analysis && !isGenerating && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`rounded-xl border p-4 space-y-3 shadow-sm ${getThreatColor(analysis.threat_level)}`}>
                 <div className="flex justify-between items-center border-b border-black/10 pb-2">
                    <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide">
                       <ScanEye className="w-4 h-4"/> AI Analysis
                    </div>
                    <div className="text-xs font-bold px-2 py-1 bg-white/50 rounded-md">
                       Threat: {analysis.threat_level}/100
                    </div>
                 </div>
                 <div className="space-y-2 text-sm">
                    <p><strong>🧠 Translation:</strong> {analysis.translation}</p>
                    <p><strong>🛡️ Strategy:</strong> {analysis.strategy_advice}</p>
                 </div>
              </div>
           </div>
        )}

        {/* REPLIES LIST */}
        {replies.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-8 duration-700">
             {replies.map((reply, index) => (
                <div
                 key={index}
                 onClick={() => setSelectedReply(reply)}
                 className={`p-4 rounded-xl border bg-white cursor-pointer relative shadow-sm hover:shadow-md transition-all ${
                     selectedReply === reply ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-100'
                 }`}
                >
                  <p className="text-slate-800 pr-8">{reply}</p>
                  <button 
                     onClick={(e) => { e.stopPropagation(); handleCopy(reply, index); }}
                     className="absolute top-3 right-3 text-slate-400 hover:text-indigo-600"
                  >
                     {copiedIndex === index ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                  </button>
                </div>
             ))}
          </div>
        )}

      </main>
      <KeyboardBar selectedReply={selectedReply} />
    </div>
  );
}