import { MessageCircle, Camera, Sparkles } from 'lucide-react';

export default function HelpScreen() {
  const steps = [
    {
      icon: MessageCircle,
      title: "1. Create a Profile",
      desc: "Add a new profile for the person you are chatting with. Give them a name and define your relationship (e.g., 'Best Friend', 'Client')."
    },
    {
      icon: Camera,
      title: "2. Upload Context",
      desc: "Take a screenshot of your chat or copy the text. Uploading a screenshot allows our AI to read the last few messages for perfect context."
    },
    {
      icon: Sparkles,
      title: "3. Generate Replies",
      desc: "Paste the incoming message you received. Choose a 'Vibe' (like Flirty or Professional) and hit Generate. You will get 3 options instantly."
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">How to use Kue</h1>
        <p className="text-muted-foreground mt-2">Master the art of the perfect reply in 3 steps.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <div key={i} className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
              <step.icon size={24} />
            </div>
            <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-xl dark:bg-blue-900/20 dark:border-blue-900">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100">Pro Tip</h4>
        <p className="text-blue-700 dark:text-blue-300 mt-1">
          The AI works best when you provide specific context in the "Relationship Description" field. 
          Instead of just "Boss", try "Strict boss who hates emojis."
        </p>
      </div>
      <a 
  href="mailto:avikhawlader2002@gmail.com?subject=Kue%20Support%20Request&body=Describe%20your%20issue%20here..."
  className="text-indigo-600 hover:underline"
>
  Contact Support
</a>
    </div>
  );
}