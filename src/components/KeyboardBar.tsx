import { Keyboard, Send } from "lucide-react";
import { toast } from "sonner";

interface KeyboardBarProps {
  selectedReply?: string | null;
}

export default function KeyboardBar({ selectedReply }: KeyboardBarProps) {
  const handleSend = () => {
    if (selectedReply) {
      toast.success("Sent to WhatsApp (Simulation)");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-8 flex items-center gap-3 max-w-md mx-auto z-20">
      <div className="p-2 bg-slate-100 rounded-full">
        <Keyboard size={20} className="text-slate-500" />
      </div>
      <div className="flex-1 bg-slate-100 rounded-full px-4 py-3 text-sm text-slate-500 truncate">
        {selectedReply || "Select a reply above..."}
      </div>
      <button 
        onClick={handleSend}
        disabled={!selectedReply}
        className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send size={20} />
      </button>
    </div>
  );
}